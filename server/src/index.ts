
import { Hono } from 'hono'

import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { timeout } from 'hono/timeout'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { trimTrailingSlash } from 'hono/trailing-slash'

import { getEmbedding, askGemini } from './lib/gemini'
import { searchVectorizeDB, insertVector } from './lib/vectorizeDB'
import { isInovusQuestion, needsLiveData } from './lib/guardrails'
import { getLiveMCPData } from './lib/mcp'

const app = new Hono()



// Middleware setup
app.use('*', logger())
app.use('*', requestId());
app.use(timeout(10000));
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



app.get('/', (c) => c.json({
  status: 'OK',
  message: 'API is working properly',
}, 200));


app.use((c) => c.json({
  status: 'Not Found',
  message: 'API endpoint not found',
}, 404));



// Main API endpoint for asking questions
app.post('/ask', async (c) => {
  try {
    const { question } = await c.req.json()
    if (!question || typeof question !== 'string' || question.length < 5) {
      return c.json({ error: 'Invalid or too short question.' }, 400)
    }

    // Guardrail: ensure question is about Inovus Labs
    const relevant = await isInovusQuestion(question)
    if (!relevant) {
      return c.json({ answer: "Sorry, I can only answer questions about Inovus Labs." })
    }

    const embedding = await getEmbedding(question)
    const contextChunks = await searchVectorizeDB(embedding)
    
    const requireLiveData = await needsLiveData(question)
    const liveData = requireLiveData ? await getLiveMCPData() : ''

    const answer = await askGemini(question, contextChunks, liveData)
    return c.json({ answer })
  } catch (e) {
    return c.json({ error: 'Server error', detail: (e as any).message }, 500)
  }
})



// Ingestion API (for uploading document chunks)
app.post('/ingest', async (c) => {
  try {
    const { content, metadata } = await c.req.json()
    if (!content || typeof content !== 'string' || content.length < 10) {
      return c.json({ error: 'Invalid or too short content.' }, 400)
    }
    const embedding = await getEmbedding(content)
    await insertVector(embedding, content, metadata || {})
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Server error', detail: (e as any).message }, 500)
  }
})


export default app