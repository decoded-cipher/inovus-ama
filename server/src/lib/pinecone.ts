import { env } from 'hono/adapter'


export interface VectorMatch {
  id: string
  content: string
  metadata: any
}

const PINECONE_ENVIRONMENT = env.PINECONE_ENVIRONMENT || 'https://inovus-ama-nhrc3r1.svc.aped-4627-b74a.pinecone.io'
const PINECONE_API_KEY = env.PINECONE_API_KEY || 'pcsk_2tSPGi_CWZZ1UJ5CDEMcmib1mzrGmxH8Tvkamxtq9dx2gVMh9EK2591en5qP8n1HPHJwfV'



/**
 * Searches Pinecone for vectors similar to the provided query vector.
 * Returns an array of VectorMatch objects containing the ID, content, and metadata.
 * 
 * @param queryVector - The vector to search for
 * @returns A promise that resolves to an array of VectorMatch objects
 */

export async function searchVectorizeDB(queryVector: number[]): Promise<VectorMatch[]> {
  console.log(`Searching Pinecone for vector: ${queryVector.slice(0, 5)}...`)

  const response = await fetch(`${PINECONE_ENVIRONMENT}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': PINECONE_API_KEY,
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



/**
 * Inserts a vector into Pinecone with the given embedding, content, and metadata.
 * Generates a unique ID for the vector using crypto.randomUUID().
 * 
 * @param embedding - The vector embedding to insert
 * @param content - The content associated with the vector
 * @param metadata - Additional metadata to store with the vector
 */

export async function insertVector(embedding: number[], content: string, metadata: any): Promise<void> {
  await fetch(`${PINECONE_ENVIRONMENT}/vectors/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': PINECONE_API_KEY,
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
