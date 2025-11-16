
import { GoogleGenAI } from '@google/genai'


interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}



/**
 * Initializes the Gemini client with the provided API key.
 * @param apiKey - The Gemini API key
 * @param generativeModel - The generative model name
 * @param embeddingModel - The embedding model name
 * @returns Object containing model functions
 */

function getGeminiClient(
  apiKey: string, 
  generativeModel: string,
  embeddingModel: string
) {
  const ai = new GoogleGenAI({ apiKey })
  
  return {
    generateContent: async (prompt: string, systemInstruction: string) => {
      const result = await ai.models.generateContent({
        model: generativeModel,
        contents: prompt,
        config: {
          systemInstruction
        }
      })
      return result.text
    },
    
    createChat: (systemInstruction: string, history: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }> = []) => {
      return ai.chats.create({
        model: generativeModel,
        config: {
          systemInstruction
        },
        history
      })
    },
    
    embedContent: async (text: string) => {
      const result = await ai.models.embedContent({
        model: embeddingModel,
        contents: text,
        config: {
          outputDimensionality: 768
        }
      })
      
      if (!result.embeddings || result.embeddings.length === 0 || !result.embeddings[0].values) {
        throw new Error('Failed to generate embedding')
      }
      
      return result.embeddings[0].values
    }
  }
}



/**
 * Generates an embedding for the given text using Gemini's embedding model.
 * @param text - The text to embed
 * @param apiKey - The Gemini API key
 * @param embeddingModel - Optional embedding model name
 * @returns A promise that resolves to the embedding vector
 */

export async function getEmbedding(
  text: string, 
  apiKey: string, 
  embeddingModel?: string
): Promise<number[]> {
  console.log(`\n\n--- Generating embedding for text: "${text.slice(0, 50)}..."`);
  
  const client = getGeminiClient(apiKey, undefined, embeddingModel)
  const embedding = await client.embedContent(text)
  
  console.log(`--- Generated embedding of length: ${embedding.length}`);
  if (embedding.length === 0) {
    throw new Error('--- Embedding is empty')
  }
  
  return embedding
}



/**
 * Summarizes a conversation history into a concise summary.
 * @param messages - Array of conversation messages
 * @param apiKey - The Gemini API key
 * @param generativeModel - Optional generative model name
 * @returns A promise that resolves to the summary text
 */

export async function summarizeConversation(
  messages: ConversationMessage[], 
  apiKey: string,
  generativeModel?: string
): Promise<string> {
  if (messages.length === 0) return ''
  
  const conversationText = messages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n')
  
  const systemInstruction = `Summarize the provided conversation history into a concise summary that preserves key context for follow-up questions.

RULES:
- Create a 2-3 sentence summary
- Focus on key topics discussed about Inovus Labs IEDC
- Preserve important context relevant for answering follow-up questions
- Be concise but comprehensive
- Return only the summary text, no additional formatting`

  const prompt = `
<conversation_history>
${conversationText}
</conversation_history>
`.trim()

  const client = getGeminiClient(apiKey, generativeModel)
  return await client.generateContent(prompt, systemInstruction)
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
  return `
<knowledge_base>
<static_context>
${context}
</static_context>

${liveData ? `<live_data>\n${liveData}\n</live_data>\n` : ''}

${conversationSummary ? `<conversation_history>\n${conversationSummary}\n</conversation_history>\n` : ''}
</knowledge_base>

<user_query type="${isFollowUp ? 'follow_up' : 'initial'}">
${question}
</user_query>

<instructions>
${!isFollowUp ? '- Valid topics: programs, events, startups, innovation, entrepreneurship, workshops, mentorship, funding opportunities\n' : ''}
${isFollowUp ? '- Build naturally on the previous conversation context\n' : ''}
${!isFollowUp ? '- Provide actionable next steps when applicable\n' : ''}
- Respond with clean HTML using semantic tags
- Structure your response within a body tag
</instructions>
`.trim()
}



/**
 * Asks Gemini a question with context, live data, and conversation history using multi-turn chat.
 * @param question - The user's question
 * @param chunks - Static context chunks to include
 * @param liveData - Any live data relevant to the question
 * @param conversationHistory - Previous conversation messages
 * @param apiKey - The Gemini API key
 * @param generativeModel - Optional generative model name
 * @returns A promise that resolves to the assistant's response
 */

export async function askGemini(
  question: string, 
  chunks: string[], 
  liveData: string, 
  conversationHistory: ConversationMessage[] = [],
  apiKey: string,
  generativeModel?: string
): Promise<string> {
  const context = chunks.length
    ? chunks.join('\n---\n')
    : '[No additional static context found.]'
  
  const isFollowUp = await isFollowUpQuestion(question)
  
  // Handle conversation history: summarize old messages, keep recent ones
  let history: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }> = []
  let conversationSummary = ''
  
  if (conversationHistory.length > 4) {
    // Keep last 2 exchanges (4 messages) and summarize the rest
    const messagesToSummarize = conversationHistory.slice(0, -4)
    const recentMessages = conversationHistory.slice(-4)
    
    if (messagesToSummarize.length > 0) {
      conversationSummary = await summarizeConversation(messagesToSummarize, apiKey, generativeModel)
    }
    
    // Convert only recent messages to chat history
    history = recentMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }]
    }))
  } else if (conversationHistory.length > 0) {
    // If 4 or fewer messages, include all without summarizing
    history = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }]
    }))
  }
  
  const systemInstruction = `You are an AI assistant for Inovus Labs IEDC at Kristu Jyoti College (inovuslabs.org, @inovuslabs). You MUST only use the provided context to answer questions.

CRITICAL RULES:
- You can ONLY answer questions about Inovus Labs IEDC using the provided context
- If the answer is not found in the provided context, you MUST respond: "I don't have that specific information in my knowledge base. Please check our website at inovuslabs.org or follow our social media @inovuslabs for the most up-to-date information."
- NEVER make up or infer information not explicitly provided in the context
- NEVER use external knowledge beyond what's provided
- For off-topic questions: "I can only answer questions related to Inovus Labs IEDC. Please ask about our programs, events, or initiatives."
- Use proper HTML with semantic structure (body tag)
- NO markdown formatting, NO CSS styles
- Maintain a friendly, helpful tone
- Use emojis appropriately to enhance engagement
${!isFollowUp ? '\n- Valid topics: programs, events, startups, innovation, entrepreneurship, workshops, mentorship, funding opportunities' : ''}
${isFollowUp ? '\n- Build naturally on the previous conversation context' : ''}
${!isFollowUp ? '\n- Provide actionable next steps when applicable' : ''}

KNOWLEDGE BASE:
${context}

${liveData ? `LIVE DATA:\n${liveData}` : ''}

${conversationSummary ? `CONVERSATION SUMMARY (older messages):\n${conversationSummary}` : ''}`

  const client = getGeminiClient(apiKey, generativeModel)
  const chat = client.createChat(systemInstruction, history)
  
  console.log(`--- Using multi-turn chat with ${history.length} recent messages in history${conversationSummary ? ' (with summary of older messages)' : ''}.`)
  
  const response = await chat.sendMessage({
    message: question
  })

  return response.text
}



/**
 * Generates follow-up suggestions based on the last assistant message and conversation context.
 * @param lastAssistantMessage - The last message from the assistant
 * @param conversationContext - The context of the conversation
 * @param apiKey - The Gemini API key
 * @param generativeModel - Optional generative model name
 * @returns A promise that resolves to an array of follow-up questions
 */

export async function generateFollowUpSuggestions(
  lastAssistantMessage: string,
  conversationContext: string,
  apiKey: string,
  generativeModel?: string
): Promise<string[]> {
  const systemInstruction = `Generate relevant follow-up questions based on the assistant's response and conversation context.

RULES:
- Generate exactly 3 specific and actionable follow-up questions
- Questions should be relevant to Inovus Labs IEDC topics
- Make them natural conversation continuations
- Focus on practical next steps or deeper information
- One question per line, no numbering or bullets
- Return exactly 3 questions, one per line`

  const prompt = `
<context>
<assistant_response>
${lastAssistantMessage}
</assistant_response>

<conversation_context>
${conversationContext}
</conversation_context>
</context>
`.trim()

  try {
    const client = getGeminiClient(apiKey, generativeModel)
    const suggestions = await client.generateContent(prompt, systemInstruction)
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
