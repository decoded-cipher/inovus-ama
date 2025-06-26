
import { env } from 'hono/adapter'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'models/gemini-pro' })
const embedModel = genAI.getGenerativeModel({ model: 'models/embedding-001' })



// Get vector embedding from Gemini for a given text
export async function getEmbedding(text: string): Promise<number[]> {
  const result = await embedModel.embedContent({ content: { parts: [{ text }] } })
  return result.embedding.values
}


// Generates the answer with both static context and (optional) live data
export async function askGemini(question: string, chunks: string[], liveData: string): Promise<string> {
  const context = chunks.length
    ? chunks.join('\n---\n')
    : '[No additional static context found.]'
  
  const prompt = `
    You are an expert assistant for Inovus Labs. Use only the provided context to answer the question.
    
    Static Context: ${context}
    
    ${liveData ? `Live Data:\n${liveData}\n` : ''}

    Question: ${question}
    
    If you do not have enough information, politely respond that you don't know or can't answer.
  `.trim()

  const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] })
  return result.response.text()
}
