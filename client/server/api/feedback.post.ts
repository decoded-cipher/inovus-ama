import { getClientIP } from '../utils'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readFormData(event)
    
    // Extract form data
    const type = formData.get('type')
    const description = formData.get('description')
    const contactEmail = formData.get('contactEmail')
    const image = formData.get('image') as File | null
    const turnstileToken = formData.get('cf-turnstile-response')
    
    // Validate required fields
    if (!type || !description) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }

    // Validate Turnstile token
    if (!turnstileToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Security verification required'
      })
    }

    // Verify Turnstile token with Cloudflare
    const config = useRuntimeConfig(event)
    const turnstileSecret = config.turnstileSecretKey
    if (!turnstileSecret) {
      console.error('Turnstile secret key not configured')
      throw createError({
        statusCode: 500,
        statusMessage: 'Security service not configured'
      })
    }

    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: turnstileToken as string,
        remoteip: getClientIP(event) || 'unknown'
      })
    })

    const turnstileResult = await turnstileResponse.json()
    
    if (!turnstileResult.success) {
      console.error('Turnstile verification failed:', turnstileResult)
      throw createError({
        statusCode: 400,
        statusMessage: 'Security verification failed. Please try again.'
      })
    }

    // Validate feedback type
    const validTypes = ['bug', 'improvement']
    if (!validTypes.includes(type as string)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid feedback type'
      })
    }

    // Get Discord webhook URL from environment
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!discordWebhookUrl) {
      console.error('Discord webhook URL not configured')
      throw createError({
        statusCode: 500,
        statusMessage: 'Feedback service not configured'
      })
    }

    // Create Discord embed
    const embed = {
      title: `📝 New Feedback: ${type === 'bug' ? 'Bug Report' : 'Improvement Suggestion'}`,
      description: description,
      color: getFeedbackColor(type as string),
      fields: [
        {
          name: '🔍 Type',
          value: getFeedbackTypeEmoji(type as string) + ' ' + (type === 'bug' ? 'Bug Report' : 'Improvement Suggestion'),
          inline: true
        },
        {
          name: '📅 Submitted',
          value: new Date().toLocaleString('en-US', { 
            timeZone: 'UTC',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) + ' UTC',
          inline: true
        }
      ],
      footer: {
        text: 'InoBot Feedback System'
      },
      timestamp: new Date().toISOString()
    }

    // Add contact email if provided
    if (contactEmail) {
      embed.fields.push({
        name: '📧 Contact',
        value: contactEmail as string,
        inline: true
      })
    }

    // Prepare Discord payload
    const discordPayload: any = {
      embeds: [embed],
      username: 'InoBot Feedback',
      avatar_url: 'https://ama.inovuslabs.org/icon-192.png'
    }

    // Handle image upload if present
    if (image && image instanceof File) {
      // Discord webhook with file upload
      const formData = new FormData()
      formData.append('payload_json', JSON.stringify(discordPayload))
      formData.append('file', image, image.name)
      
      const response = await fetch(discordWebhookUrl, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`)
      }
    } else {
      // Send without image
      const response = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(discordPayload)
      })
      
      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`)
      }
    }

    return { success: true, message: 'Feedback submitted successfully' }

  } catch (error: any) {
    console.error('Feedback submission error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

// Helper functions for Discord formatting
function getFeedbackColor(type: string): number {
  const colors: Record<string, number> = {
    bug: 0xFF0000,        // Red
    improvement: 0x0099FF  // Blue
  }
  return colors[type] || 0x0099FF
}

function getFeedbackTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    bug: '🐛',
    improvement: '✨'
  }
  return emojis[type] || '✨'
}
