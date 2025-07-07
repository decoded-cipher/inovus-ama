
import { Hono } from "hono";
const router = new Hono();

import { uploadToR2 } from './lib/r2'
import { getLiveMCPData } from './lib/mcp'
import { getEmbedding, askGemini, generateFollowUpSuggestions } from './lib/gemini'
import { isInovusQuestion, needsLiveData } from './lib/guardrails'
import { searchVectorizeDB, insertVector } from './lib/vectorizeDB'



// Main API endpoint for asking questions
router.post('/ask', async (c) => {
  try {
    const { question, conversationHistory = [] } = await c.req.json()
    if (!question || typeof question !== 'string' || question.length < 5) {
      return c.json({ error: 'Invalid or too short question.' }, 400)
    }

    // Validate conversation history format
    const validatedHistory = Array.isArray(conversationHistory) 
      ? conversationHistory
          .filter(msg => 
            msg && 
            typeof msg === 'object' && 
            typeof msg.content === 'string' && 
            ['user', 'assistant'].includes(msg.role)
          )
          .map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          }))
      : []

    // Guardrail: ensure question is about Inovus Labs
    // const relevant = await isInovusQuestion(question)
    // if (!relevant) {
    //   return c.json({ answer: "Sorry, I can only answer questions about Inovus Labs." })
    // }

    const embedding = await getEmbedding(question)
    const matches = await searchVectorizeDB(embedding)
    const contextChunks = matches.map(m => m.content)
    
    const requireLiveData = await needsLiveData(question)
    const liveData = requireLiveData ? await getLiveMCPData() : ''

    const answer = await askGemini(question, contextChunks, liveData, validatedHistory)
    const references = matches.map(m => m.metadata)
    
    // Generate follow-up suggestions if there's conversation history
    let followUpSuggestions: string[] = []
    if (validatedHistory.length > 0) {
      const conversationContext = validatedHistory
        .slice(-2) // Last 2 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')
      
      followUpSuggestions = await generateFollowUpSuggestions(answer, conversationContext)
    }
    
    return c.json({ 
      answer, 
      references, 
      followUpSuggestions: followUpSuggestions.length > 0 ? followUpSuggestions : undefined 
    })
  } catch (e) {
    return c.json({ error: 'Server error', detail: (e as any).message }, 500)
  }
})



// Upload API for files of any format
// Upload API for files of any format
router.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']
    if (!(file instanceof File)) {
      return c.json({ error: 'Missing file' }, 400)
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return c.json({ error: 'File too large. Maximum size is 10MB.' }, 400)
    }

    const metaRaw = body['metadata']
    let metadata = {}
    if (typeof metaRaw === 'string') {
      try { 
        metadata = JSON.parse(metaRaw) 
      } catch { 
        metadata = {} 
      }
    }

    // Upload file to R2 first to get the permanent URL
    const fileKey = await uploadToR2(file)
    const fileUrl = `https://pub-dbf744bbd34f4c819d82cdae83b7fe37.r2.dev/${fileKey}` // Replace with your R2 domain

    // Extract text content based on file type
    let textContent = ''
    const fileType = file.type || ''
    const fileName = file.name.toLowerCase()

    try {
      if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        // Plain text files
        textContent = await file.text()
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        // For PDF files, you'll need to implement PDF text extraction
        // This is a placeholder - you'll need a library like pdf-parse
        textContent = await extractPDFText(file)
      } else if (fileType.includes('json') || fileName.endsWith('.json')) {
        // JSON files
        textContent = await file.text()
      } else if (fileType.includes('csv') || fileName.endsWith('.csv')) {
        // CSV files
        textContent = await file.text()
      } else if (fileName.endsWith('.docx')) {
        // Word documents - you'll need a library like mammoth
        textContent = await extractDocxText(file)
      } else {
        // Try to extract as text anyway
        textContent = await file.text()
      }
    } catch (error) {
      console.warn(`Failed to extract text from ${file.name}:`, error)
      textContent = ''
    }

    // Process and vectorize content if we have text
    if (textContent && textContent.trim().length > 0) {
      // Split large content into chunks for better vectorization
      const chunks = splitTextIntoChunks(textContent, 1000) // 1000 char chunks
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        if (chunk.trim().length < 50) continue // Skip very short chunks
        
        try {
          const embedding = await getEmbedding(chunk)
          const chunkMetadata = {
            filename: file.name,
            fileType: file.type || 'unknown',
            fileSize: file.size,
            fileUrl: fileUrl,
            chunkIndex: i,
            totalChunks: chunks.length,
            uploadedAt: new Date().toISOString(),
            ...metadata
          }
          
          await insertVector(embedding, `${fileKey}_chunk_${i}`, chunkMetadata)
        } catch (vectorError) {
          console.error(`Failed to vectorize chunk ${i} of ${file.name}:`, vectorError)
        }
      }
    }

    return c.json({ 
      success: true, 
      key: fileKey,
      fileUrl: fileUrl,
      textExtracted: textContent.length > 0,
      chunksCreated: textContent ? Math.ceil(textContent.length / 1000) : 0,
      message: textContent.length > 0 ? 
        'File uploaded and vectorized successfully' : 
        'File uploaded but no text content found for vectorization'
    })
  } catch (e) {
    console.error('Upload error:', e)
    return c.json({ 
      error: 'Server error', 
      detail: (e as any).message 
    }, 500)
  }
})

// Helper function to split text into chunks
function splitTextIntoChunks(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  let currentChunk = ''
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

// Placeholder functions for different file types
async function extractPDFText(file: File): Promise<string> {
  // You'll need to implement this using a library like pdf-parse
  // Example: const pdf = await import('pdf-parse')
  // const buffer = await file.arrayBuffer()
  // const data = await pdf(buffer)
  // return data.text
  throw new Error('PDF text extraction not implemented')
}

async function extractDocxText(file: File): Promise<string> {
  // You'll need to implement this using a library like mammoth
  // Example: const mammoth = await import('mammoth')
  // const buffer = await file.arrayBuffer()
  // const result = await mammoth.extractRawText({ buffer })
  // return result.value
  throw new Error('DOCX text extraction not implemented')
}


// Export the router
export default router