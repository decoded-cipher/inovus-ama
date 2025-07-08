import { getEmbedding } from './gemini'
import { insertVector } from './pinecone'

export interface VectorizationOptions {
  fileKey: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  metadata: Record<string, any>
  minChunkLength?: number
}

export interface VectorizationResult {
  chunksProcessed: number
  chunksSkipped: number
  errors: string[]
}

export async function vectorizeFileChunks(
  chunks: string[], 
  options: VectorizationOptions
): Promise<VectorizationResult> {
  const { 
    fileKey, 
    fileName, 
    fileType, 
    fileSize, 
    fileUrl, 
    metadata, 
    minChunkLength = 50 
  } = options

  const result: VectorizationResult = {
    chunksProcessed: 0,
    chunksSkipped: 0,
    errors: []
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    
    // Skip very short chunks
    if (chunk.trim().length < minChunkLength) {
      result.chunksSkipped++
      continue
    }
    
    try {
      const embedding = await getEmbedding(chunk)
      const chunkMetadata = {
        filename: fileName,
        fileType: fileType,
        fileSize: fileSize,
        fileUrl: fileUrl,
        chunkIndex: i,
        totalChunks: chunks.length,
        uploadedAt: new Date().toISOString(),
        ...metadata
      }
      
      await insertVector(embedding, `${fileKey}_chunk_${i}`, chunkMetadata)
      result.chunksProcessed++
    } catch (vectorError) {
      const errorMsg = `Failed to vectorize chunk ${i}: ${(vectorError as Error).message}`
      console.error(errorMsg)
      result.errors.push(errorMsg)
    }
  }

  return result
}
