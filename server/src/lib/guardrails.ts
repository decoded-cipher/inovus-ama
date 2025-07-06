
import { getEmbedding } from './gemini'
import { searchVectorizeDB } from './vectorizeDB'


// Checks if the question is relevant to Inovus Labs
export async function isInovusQuestion(question: string): Promise<boolean> {
  console.log(`Checking if question is relevant: "${question}"`);
  
  const embedding = await getEmbedding(question)
  const matches = await searchVectorizeDB(embedding)
  return matches.length > 0
}


// Determines if live MCP data should be fetched based on keywords
export async function needsLiveData(question: string): Promise<boolean> {
  const keywords = [
    'status', 'current', 'uptime', 'live',
    'availability', 'open', 'today', 'now', 'recent'
  ]
  return keywords.some(kw => question.toLowerCase().includes(kw))
}
