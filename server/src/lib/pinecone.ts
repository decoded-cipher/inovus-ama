import { env } from 'hono/adapter'


export interface VectorMatch {
  id: string
  content: string
  metadata: any
}



/**
 * Searches Pinecone for vectors similar to the provided query vector.
 * Returns an array of VectorMatch objects containing the ID, content, and metadata.
 * 
 * @param queryVector - The vector to search for
 * @returns A promise that resolves to an array of VectorMatch objects
 */

export async function searchVectorizeDB(queryVector: number[], env: any = env): Promise<VectorMatch[]> {
  console.log(`--- Searching Pinecone for vector: ${queryVector.slice(0, 5)}...`)

  const response = await fetch(`${env.PINECONE_ENV}/query`, {
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

  console.log(`--- Found ${results.matches?.length || 0} matches for vector.`);

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

export async function insertVector(embedding: number[], content: string, metadata: any = {}, env: any = env): Promise<void> {
  console.log(`--- Inserting vector with content: "${content.slice(0, 50)}..."`)
  
  await fetch(`${env.PINECONE_ENV}/vectors/upsert`, {
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
