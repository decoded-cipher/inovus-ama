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
    const { question, conversationHistory, turnstileToken } = body

    if (!question || typeof question !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid question parameter'
      })
    }

    // Get runtime config for Turnstile verification
    const config = useRuntimeConfig(event)
    
    // Verify Turnstile token if provided
    if (turnstileToken) {
      try {
        const turnstileResponse = await $fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: config.turnstileSecretKey,
            response: turnstileToken,
            remoteip: getClientIP(event) || '',
          }),
        })

        if (!turnstileResponse.success) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Turnstile verification failed'
          })
        }
      } catch (turnstileError) {
        console.error('Turnstile verification error:', turnstileError)
        throw createError({
          statusCode: 403,
          statusMessage: 'Security verification failed'
        })
      }
    }

    // Get server URL from runtime config
    const serverUrl = config.public.serverUrl
    
    if (!serverUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server URL is not configured'
      })
    }

    // Forward the request to the actual server
    const response = await $fetch(`${serverUrl}/api/v1/ask`, {
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
