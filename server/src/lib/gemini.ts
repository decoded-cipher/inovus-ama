
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



/**
 * Generates an embedding for the given text using Gemini's embedding model.
 * @param text - The text to embed
 * @returns A promise that resolves to the embedding vector
 */

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



/**
 * Summarizes a conversation history into a concise summary.
 * @param messages - Array of conversation messages
 * @returns A promise that resolves to the summary text
 */

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



/**
 * Checks if a question is likely a follow-up based on common indicators.
 * @param question - The question to analyze
 * @returns A promise that resolves to true if it's a follow-up, false otherwise
 */

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



/**
 * Generates a follow-up prompt based on the question, context, live data, and conversation summary.
 * @param question - The user's question
 * @param context - Static context information
 * @param liveData - Any live data relevant to the question
 * @param conversationSummary - Summary of previous conversation messages
 * @param isFollowUp - Whether the question is a follow-up
 * @returns A promise that resolves to the generated prompt string
 */

export async function generateFollowUpPrompt(
  question: string,
  context: string,
  liveData: string,
  conversationSummary: string,
  isFollowUp: boolean
): Promise<string> {
  if (isFollowUp && conversationSummary) {
    return `
You are an assistant for Inovus Labs IEDC at Kristu Jyoti College (inovuslabs.org, @inovuslabs).

Context: ${context}
${liveData ? `Live Data: ${liveData}\n` : ''}
Previous Context: ${conversationSummary}

Follow-up: ${question}

RULES:
- Only answer Inovus Labs IEDC questions
- Off-topic → Mention that you can only answer Inovus Labs IEDC questions
- No info → Mention that you don't have that information and suggest checking the website or socials
- Build on previous conversation naturally
    `.trim()
  } else {
    return `
You are an assistant for Inovus Labs IEDC at Kristu Jyoti College (inovuslabs.org, @inovuslabs).

Context: ${context}
${liveData ? `Live Data: ${liveData}\n` : ''}
${conversationSummary ? `History: ${conversationSummary}\n` : ''}

Question: ${question}

RULES:
- Only answer Inovus Labs IEDC questions
- Topics: programs, events, startups, innovation, entrepreneurship, workshops, mentorship, funding
- Off-topic → Mention that you can only answer Inovus Labs IEDC questions
- No info → Mention that you don't have that information and suggest checking the website or socials
`.trim()
  }
}



/**
 * Asks Gemini a question with context, live data, and conversation history.
 * @param question - The user's question
 * @param chunks - Static context chunks to include
 * @param liveData - Any live data relevant to the question
 * @param conversationHistory - Previous conversation messages
 * @returns A promise that resolves to the assistant's response
 */

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
  
  const isFollowUp = await isFollowUpQuestion(question)
  
  const prompt = await generateFollowUpPrompt(
    question, 
    context, 
    liveData, 
    conversationSummary, 
    isFollowUp
  )

  console.log(`\nGenerated prompt for Gemini:\n\n${prompt}\n`)

  const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] })
  return result.response.text()
}



/**
 * Generates follow-up suggestions based on the last assistant message and conversation context.
 * @param lastAssistantMessage - The last message from the assistant
 * @param conversationContext - The context of the conversation
 * @returns A promise that resolves to an array of follow-up questions
 */

export async function generateFollowUpSuggestions(
  lastAssistantMessage: string,
  conversationContext: string
): Promise<string[]> {
  const prompt = `
Based on this assistant response and conversation context, generate 3 relevant follow-up questions that a user might want to ask next. Make them specific and actionable.

Assistant's last response: ${lastAssistantMessage}

Conversation context: ${conversationContext}

Generate exactly 1 follow-up questions, one per line, without numbering or bullets:
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
    return [
      "Can you elaborate on that?",
      "What else should I know?",
      "How can I get started?"
    ]
  }
}
