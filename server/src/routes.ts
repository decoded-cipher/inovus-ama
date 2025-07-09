
import { Hono } from "hono";
const router = new Hono();

import { uploadToR2 } from './lib/r2'
import { getLiveMCPData } from './lib/mcp'
import { isInovusQuestion, needsLiveData } from './lib/guardrails'
import { searchVectorizeDB } from './lib/pinecone'
import { getEmbedding, askGemini, generateFollowUpSuggestions } from './lib/gemini'
import { processFile, parseMetadata } from './lib/fileProcessor'
import { vectorizeFileChunks } from './lib/vectorizationService'



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
    // const relevant = await isInovusQuestion(question, c.env)
    // if (!relevant) {
    //   return c.json({ answer: "Sorry, I can only answer questions about Inovus Labs." })
    // }

    const embedding = await getEmbedding(question, c.env.GEMINI_API_KEY)
    const matches = await searchVectorizeDB(embedding, c.env)
    const contextChunks = matches.map(m => m.content)
    
    // const requireLiveData = await needsLiveData(question)
    // const liveData = requireLiveData ? await getLiveMCPData() : ''
    const liveData = ''

    const answer = await askGemini(question, contextChunks, liveData, validatedHistory, c.env.GEMINI_API_KEY)
    const references = matches.map(m => m.metadata)

    console.log(`\n\n--- Answer generated successfully.`)
    // console.log(`\n\n${answer}`);
    
    
    
    // Generate follow-up suggestions if there's conversation history
    // let followUpSuggestions: string[] = []
    // if (validatedHistory.length > 0) {
    //   const conversationContext = validatedHistory
    //     .slice(-2) // Last 2 messages for context
    //     .map(msg => `${msg.role}: ${msg.content}`)
    //     .join('\n')
      
    //   followUpSuggestions = await generateFollowUpSuggestions(answer, conversationContext)
    // }
    
    return c.json({ 
      answer, 
      references, 
      // followUpSuggestions: followUpSuggestions.length > 0 ? followUpSuggestions : undefined 
    })
  } catch (e) {
    return c.json({ error: 'Server error', detail: (e as any).message }, 500)
  }
})



// Upload API for files of any format
router.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']
    
    // Validate file presence
    if (!(file instanceof File)) {
      return c.json({ error: 'Missing file' }, 400)
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'File too large. Maximum size is 10MB.' }, 400)
    }

    // Parse metadata
    const metadata = parseMetadata(body['metadata'])

    // Upload file to R2 storage
    const fileKey = await uploadToR2(file)
    const fileUrl = `${c.env.R2_PUBLIC_DOMAIN}/${fileKey}`

    // Process file and extract text content
    const processingResult = await processFile(file, 1000)
    
    // Handle processing errors
    if (processingResult.error) {
      console.warn(`File processing warning for ${file.name}:`, processingResult.error)
    }

    let vectorizationResult = null
    
    // Vectorize content if text was extracted
    if (processingResult.textContent.trim().length > 0) {
      vectorizationResult = await vectorizeFileChunks(processingResult.chunks, {
        fileKey,
        fileName: file.name,
        fileType: file.type || 'unknown',
        fileSize: file.size,
        fileUrl,
        metadata
      }, c.env)
    }

    // Prepare response
    const response = {
      success: true,
      key: fileKey,
      fileUrl: fileUrl,
      textExtracted: processingResult.textContent.length > 0,
      chunksCreated: processingResult.chunks.length,
      message: processingResult.textContent.length > 0 
        ? 'File uploaded and vectorized successfully'
        : 'File uploaded but no text content found for vectorization'
    }

    // Add vectorization details if available
    if (vectorizationResult) {
      Object.assign(response, {
        chunksProcessed: vectorizationResult.chunksProcessed,
        chunksSkipped: vectorizationResult.chunksSkipped,
        vectorizationErrors: vectorizationResult.errors.length > 0 ? vectorizationResult.errors : undefined
      })
    }

    return c.json(response)

  } catch (e) {
    console.error('Upload error:', e)
    return c.json({ 
      error: 'Server error', 
      detail: (e as any).message 
    }, 500)
  }
})


export default router