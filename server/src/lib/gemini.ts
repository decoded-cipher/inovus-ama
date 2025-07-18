
import { GoogleGenerativeAI } from '@google/generative-ai'


interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}



/**
 * Initializes the Gemini client with the provided API key.
 * @param apiKey - The Gemini API key
 * @returns An object containing the generative model and embedding model
 */

function getGeminiClient(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  return {
    model: genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' }),
    embedModel: genAI.getGenerativeModel({ model: 'models/embedding-001' })
  }
}



/**
 * Generates an embedding for the given text using Gemini's embedding model.
 * @param text - The text to embed
 * @param apiKey - The Gemini API key
 * @returns A promise that resolves to the embedding vector
 */

export async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  console.log(`\n\n--- Generating embedding for text: "${text.slice(0, 50)}..."`);
  
  const { embedModel } = getGeminiClient(apiKey)
  const result = await embedModel.embedContent({ content: { parts: [{ text }] } })
  if (!result.embedding || !result.embedding.values) {
    throw new Error('--- Failed to generate embedding')
  }

  console.log(`--- Generated embedding of length: ${result.embedding.values.length}`);
  if (result.embedding.values.length === 0) {
    throw new Error('--- Embedding is empty')
  }
  
  return result.embedding.values
}



/**
 * Summarizes a conversation history into a concise summary.
 * @param messages - Array of conversation messages
 * @param apiKey - The Gemini API key
 * @returns A promise that resolves to the summary text
 */

export async function summarizeConversation(messages: ConversationMessage[], apiKey: string): Promise<string> {
  if (messages.length === 0) return ''
  
  const conversationText = messages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n')
  
  const prompt = `
    Summarize this conversation history in 2-3 sentences, focusing on key topics discussed and important context that would be relevant for answering follow-up questions:
    
    ${conversationText}
    
    Summary:
  `.trim()

  const { model } = getGeminiClient(apiKey)
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
  const questionLabel = isFollowUp ? "Follow-up" : "Question"
  
  return `
You are an assistant for Inovus Labs IEDC at Kristu Jyoti College (inovuslabs.org, @inovuslabs).

Context: ${context}
${liveData ? `Live Data: ${liveData}\n` : ''}
${conversationSummary ? `${isFollowUp ? 'Previous Context' : 'History'}: ${conversationSummary}\n` : ''}

${questionLabel}: ${question}

RULES:
- Only answer Inovus Labs IEDC questions
${!isFollowUp ? '- Topics: programs, events, startups, innovation, entrepreneurship, workshops, mentorship, funding\n' : ''}
- Off-topic → Mention that you can only answer Inovus Labs IEDC questions
- No info → Mention that you don't have that information and suggest checking the website or socials
${isFollowUp ? '- Build on previous conversation naturally\n' : ''}
${!isFollowUp ? '- Provide actionable next steps if applicable\n' : ''}
- Get result as proper HTML with appropriate tags. Use semantic HTML structure (body). No markdown formatting. No CSS styles.
- Use a friendly, helpful tone. Use emojis where appropriate.
`.trim()
}



/**
 * Asks Gemini a question with context, live data, and conversation history.
 * @param question - The user's question
 * @param chunks - Static context chunks to include
 * @param liveData - Any live data relevant to the question
 * @param conversationHistory - Previous conversation messages
 * @param apiKey - The Gemini API key
 * @returns A promise that resolves to the assistant's response
 */

export async function askGemini(
  question: string, 
  chunks: string[], 
  liveData: string, 
  conversationHistory: ConversationMessage[] = [],
  apiKey: string
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
      conversationSummary = await summarizeConversation(messagesToSummarize, apiKey)
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

  console.log(`--- Generated prompt for Gemini.`)
  // console.log(`\n\n${prompt}\n\n`)

  const { model } = getGeminiClient(apiKey)
  const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] })
  return result.response.text()
}



/**
 * Generates follow-up suggestions based on the last assistant message and conversation context.
 * @param lastAssistantMessage - The last message from the assistant
 * @param conversationContext - The context of the conversation
 * @param apiKey - The Gemini API key
 * @returns A promise that resolves to an array of follow-up questions
 */

export async function generateFollowUpSuggestions(
  lastAssistantMessage: string,
  conversationContext: string,
  apiKey: string
): Promise<string[]> {
  const prompt = `
Based on this assistant response and conversation context, generate 3 relevant follow-up questions that a user might want to ask next. Make them specific and actionable.

Assistant's last response: ${lastAssistantMessage}

Conversation context: ${conversationContext}

Generate exactly 1 follow-up questions, one per line, without numbering or bullets:
`.trim()

  try {
    const { model } = getGeminiClient(apiKey)
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
