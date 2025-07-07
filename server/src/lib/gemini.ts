
import { env } from 'hono/adapter'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = env.GEMINI_API_KEY || 'AIzaSyDQzu-HUDuOgwFsDa1A3iElwqn0zBDihNI'

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' })
const embedModel = genAI.getGenerativeModel({ model: 'models/embedding-001' })



interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}



// Get vector embedding from Gemini for a given text
export async function getEmbedding(text: string): Promise<number[]> {
  console.log(`Generating embedding for text: "${text.slice(0, 50)}..."`);
  
  const result = await embedModel.embedContent({ content: { parts: [{ text }] } })
  if (!result.embedding || !result.embedding.values) {
    throw new Error('Failed to generate embedding')
  }

  console.log(`Generated embedding of length: ${result.embedding.values.length}`);
  if (result.embedding.values.length === 0) {
    throw new Error('Embedding is empty')
  }
  
  return result.embedding.values
}



// Summarize conversation history to reduce tokens
export async function summarizeConversation(messages: ConversationMessage[]): Promise<string> {
  if (messages.length === 0) return ''
  
  const conversationText = messages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n')
  
  const prompt = `
    Summarize this conversation history in 2-3 sentences, focusing on key topics discussed and important context that would be relevant for answering follow-up questions:
    
    ${conversationText}
    
    Summary:
  `.trim()

  const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] })
  return result.response.text()
}



// Check if a question is a follow-up that references previous conversation
export async function isFollowUpQuestion(question: string): Promise<boolean> {
  const followUpIndicators = [
    'tell me more', 'elaborate', 'can you explain', 'what about', 'more details',
    'expand on', 'continue', 'go on', 'what else', 'anything else',
    'that', 'this', 'it', 'they', 'them', 'above', 'mentioned',
    'requirements', 'process', 'steps', 'how long', 'when', 'where'
  ]
  
  const lowerQuestion = question.toLowerCase()
  return followUpIndicators.some(indicator => lowerQuestion.includes(indicator))
}



// Enhanced conversation-aware prompt generation
export async function generateFollowUpPrompt(
  question: string,
  context: string,
  liveData: string,
  conversationSummary: string,
  isFollowUp: boolean
): Promise<string> {
  if (isFollowUp && conversationSummary) {
    return `
      You are an expert assistant for Inovus Labs. The user is asking a follow-up question based on previous conversation.
      
      Static Context: ${context}
      
      ${liveData ? `Live Data:\n${liveData}\n` : ''}
      
      Previous Conversation Context:\n${conversationSummary}
      
      Follow-up Question: ${question}
      
      The user is asking for more information about something previously discussed. Provide a detailed, helpful response that builds on the previous conversation. Reference previous topics naturally and provide additional depth, specific details, or actionable next steps. If the question is ambiguous (like "tell me more"), focus on the most recent relevant topic from the conversation.
    `.trim()
  } else {
    return `
      You are an expert assistant for Inovus Labs. Use the provided context and conversation history to answer the question naturally.
      
      Static Context: ${context}
      
      ${liveData ? `Live Data:\n${liveData}\n` : ''}
      
      ${conversationSummary ? `Conversation History:\n${conversationSummary}\n` : ''}

      Current Question: ${question}
      
      Provide a helpful answer based on the context and previous conversation. If you don't have enough information, politely respond that you don't know or can't answer. Maintain conversational flow and reference previous topics when relevant.
    `.trim()
  }
}



// Generates the answer with both static context, live data, and conversation history
export async function askGemini(
  question: string, 
  chunks: string[], 
  liveData: string, 
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  const context = chunks.length
    ? chunks.join('\n---\n')
    : '[No additional static context found.]'
  
  // Summarize conversation history if it exists and is longer than 3 messages
  let conversationSummary = ''
  if (conversationHistory.length > 3) {
    // Keep last 2 exchanges (4 messages) and summarize the rest
    const messagesToSummarize = conversationHistory.slice(0, -4)
    const recentMessages = conversationHistory.slice(-4)
    
    if (messagesToSummarize.length > 0) {
      conversationSummary = await summarizeConversation(messagesToSummarize)
    }
    
    const recentConversation = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')
    
    conversationSummary = conversationSummary 
      ? `Previous conversation summary: ${conversationSummary}\n\nRecent conversation:\n${recentConversation}`
      : `Recent conversation:\n${recentConversation}`
  } else if (conversationHistory.length > 0) {
    // If less than 4 messages, include all without summarizing
    conversationSummary = conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')
  }
  
  // Check if this is a follow-up question
  const isFollowUp = await isFollowUpQuestion(question)
  
  // Generate appropriate prompt based on whether it's a follow-up
  const prompt = await generateFollowUpPrompt(
    question, 
    context, 
    liveData, 
    conversationSummary, 
    isFollowUp
  )

  const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] })
  return result.response.text()
}



// Generate suggested follow-up questions based on the conversation context
export async function generateFollowUpSuggestions(
  lastAssistantMessage: string,
  conversationContext: string
): Promise<string[]> {
  const prompt = `
    Based on this assistant response and conversation context, generate 3 relevant follow-up questions that a user might want to ask next. Make them specific and actionable.
    
    Assistant's last response: ${lastAssistantMessage}
    
    Conversation context: ${conversationContext}
    
    Generate exactly 3 follow-up questions, one per line, without numbering or bullets:
  `.trim()

  try {
    const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] })
    const suggestions = result.response.text()
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3)
    
    return suggestions.length > 0 ? suggestions : [
      "Can you tell me more about this?",
      "What are the next steps?",
      "Are there any requirements I should know about?"
    ]
  } catch (error) {
    // Fallback suggestions if generation fails
    return [
      "Can you elaborate on that?",
      "What else should I know?",
      "How can I get started?"
    ]
  }
}
