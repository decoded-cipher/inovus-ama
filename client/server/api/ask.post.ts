export default defineEventHandler(async (event) => {
  // Handle CORS
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })

  // Handle preflight requests
  if (getMethod(event) === 'OPTIONS') {
    return ''
  }

  try {
    const body = await readBody(event)
    const { question, conversationHistory } = body

    if (!question || typeof question !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid question parameter'
      })
    }

    // Get server URL from runtime config
    const config = useRuntimeConfig()
    const serverUrl = config.public.serverUrl || 'http://localhost:8787/api/v1'

    // Forward the request to the actual server
    const response = await $fetch(`${serverUrl}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        question,
        conversationHistory: conversationHistory || []
      }
    })

    return response
  } catch (error) {
    console.error('API Error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
