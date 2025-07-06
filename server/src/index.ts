
import { Hono } from 'hono'

import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { timeout } from 'hono/timeout'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { trimTrailingSlash } from 'hono/trailing-slash'

import { getEmbedding, askGemini } from './lib/gemini'
import { searchVectorizeDB, insertVector } from './lib/vectorizeDB'
import { uploadToR2 } from './lib/r2'
import { isInovusQuestion, needsLiveData } from './lib/guardrails'
import { getLiveMCPData } from './lib/mcp'

const app = new Hono()



// Middleware setup
app.use('*', logger())
app.use('*', requestId());
// app.use(timeout(10000));
app.use(secureHeaders());
app.use(trimTrailingSlash());

app.use(cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  maxAge: 3600,
  credentials: true,
  exposeHeaders: ['Content-Length', 'X-Request-ID']
}));



// Health check endpoint
app.get('/', (c) => c.json({
  status: 'OK',
  message: 'API is working properly',
}, 200));



// Main API endpoint for asking questions
app.post('/ask', async (c) => {
  try {
    const { question } = await c.req.json()
    if (!question || typeof question !== 'string' || question.length < 5) {
      return c.json({ error: 'Invalid or too short question.' }, 400)
    }

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

    const answer = await askGemini(question, contextChunks, liveData)
    const references = matches.map(m => m.metadata)
    return c.json({ answer, references })
  } catch (e) {
    return c.json({ error: 'Server error', detail: (e as any).message }, 500)
  }
})



// Upload API for files of any format
// Upload API for files of any format
app.post('/upload', async (c) => {
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



// Catch-all for 404 Not Found
app.use((c) => c.json({
  status: 'Not Found',
  message: 'API endpoint not found',
}, 404));



export default app