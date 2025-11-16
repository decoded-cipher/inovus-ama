
import { Pinecone } from '@pinecone-database/pinecone'

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

export async function searchVectorizeDB(queryVector: number[], env: any): Promise<VectorMatch[]> {
  console.log(`--- Searching Pinecone for vector: ${queryVector.slice(0, 5)}...`)

  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY })
  const index = pc.Index(env.PINECONE_INDEX_NAME, env.PINECONE_ENV)

  const results = await index.query({
    vector: queryVector,
    topK: 5,
    includeMetadata: true,
  })

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

export async function insertVector(embedding: number[], content: string, metadata: any = {}, env: any): Promise<void> {
  console.log(`--- Inserting vector with content: "${content.slice(0, 50)}..."`)
  
  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY })
  const index = pc.Index(env.PINECONE_INDEX_NAME, env.PINECONE_ENV)

  await index.upsert([
    {
      id: crypto.randomUUID(),
      values: embedding,
      metadata: { content, ...metadata },
    },
  ])
}
