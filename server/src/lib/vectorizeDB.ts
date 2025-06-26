
import { env } from 'hono/adapter'


// Query VectorizeDB for the top matching chunks
export async function searchVectorizeDB(queryVector: number[]): Promise<string[]> {
  const response = await fetch(`${env.VECTORIZE_DB_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.VECTORIZE_DB_TOKEN}`
    },
    body: JSON.stringify({ vector: queryVector, topK: 5 })
  })

  if (!response.ok) return []
  const results = await response.json()
  return results.matches.map((m: any) => m.content)
}



// Insert a new chunk into the vector store
export async function insertVector(embedding: number[], content: string, metadata: any): Promise<void> {
  await fetch(`${env.VECTORIZE_DB_URL}/insert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.VECTORIZE_DB_TOKEN}`
    },
    body: JSON.stringify({ vector: embedding, content, metadata })
  })
}
