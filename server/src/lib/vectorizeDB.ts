import { env } from 'hono/adapter'

const baseUrl = `https://${env.PINECONE_INDEX}-${env.PINECONE_PROJECT_ID}.svc.${env.PINECONE_ENVIRONMENT}.pinecone.io`

export interface VectorMatch {
  id: string
  content: string
  metadata: any
}

// Query Pinecone for top matching chunks
export async function searchVectorizeDB(queryVector: number[]): Promise<VectorMatch[]> {
  const response = await fetch(`${baseUrl}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': env.PINECONE_API_KEY,
    },
    body: JSON.stringify({
      vector: queryVector,
      topK: 5,
      includeMetadata: true,
    }),
  })

  if (!response.ok) return []
  const results = await response.json()
  return (results.matches || []).map((m: any) => ({
    id: m.id,
    content: m.metadata?.content || '',
    metadata: m.metadata || {},
  }))
}

// Insert a new vector and associated metadata
export async function insertVector(embedding: number[], content: string, metadata: any): Promise<void> {
  await fetch(`${baseUrl}/vectors/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': env.PINECONE_API_KEY,
    },
    body: JSON.stringify({
      vectors: [
        {
          id: crypto.randomUUID(),
          values: embedding,
          metadata: { content, ...metadata },
        },
      ],
    }),
  })
}
