import { getClientIP } from '../utils'
import { readFormData, getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readFormData(event)
    
    // Extract form data
    const type = formData.get('type')
    const subject = formData.get('subject')
    const description = formData.get('description')
    const contactEmail = formData.get('contactEmail')
    const image = formData.get('image') as File | null
    const turnstileToken = formData.get('cf-turnstile-response')
    
    // Validate required fields
    if (!type || !subject || !description) {
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
    const config = useRuntimeConfig()
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
    const discordWebhookUrl = config.discordWebhookUrl
    if (!discordWebhookUrl) {
      console.error('Discord webhook URL not configured')
      throw createError({
        statusCode: 500,
        statusMessage: 'Feedback service not configured'
      })
    }

    // Gather comprehensive client information
    const userAgent = getHeader(event, 'user-agent') || 'Unknown'
    const clientIP = getClientIP(event)
    const referer = getHeader(event, 'referer') || 'Direct'
    const acceptLanguage = getHeader(event, 'accept-language') || 'Unknown'
    const cfCountry = getHeader(event, 'cf-ipcountry') || 'Unknown'
    const cfColo = getHeader(event, 'cf-colo') || 'Unknown'
    const cfDeviceType = getHeader(event, 'cf-device-type') || 'Unknown'
    const cfRay = getHeader(event, 'cf-ray') || 'Unknown'
    
    // Parse user agent for better browser/OS info
    const browserInfo = parseUserAgent(userAgent)
    
    // Create cleaner Discord embed
    const embed: any = {
        title: `${getFeedbackTypeEmoji(type as string)} ${type === 'bug' ? 'Bug Report' : 'Improvement'}`,
        description: `** **\n**${subject}**\n** **\n${description}\n`,
        color: getFeedbackColor(type as string),
        fields: [
          {
            name: `** **\n💻 Environment`,
            value: `**${browserInfo.browser}** on **${browserInfo.os}** (${browserInfo.device})`,
            inline: false
          },
        ],
        footer: {
          text: 'InoBot (AMA) Feedback System'
        },
        timestamp: new Date().toISOString()
    }

    // Add network and location information
    const networkInfo: string[] = []
    if (cfCountry !== 'Unknown') networkInfo.push(`**Country:** ${cfCountry}`)
    if (cfColo !== 'Unknown') networkInfo.push(`**Data Center:** ${cfColo}`)
    if (clientIP) networkInfo.push(`**IP Address:** ${clientIP}`)
    if (cfRay !== 'Unknown') networkInfo.push(`**CF Ray:** ${cfRay}`)
    
    if (networkInfo.length > 0) {
      embed.fields.push({
        name: `** **\n🌍 Network & Location`,
        value: networkInfo.join('\n') + '\n',
        inline: false
      })
    }

    // Add contact email if provided
    if (contactEmail) {
      embed.fields.push({
        name: `** **\n📧 Contact`,
        value: (contactEmail as string) + '\n',
        inline: false
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
      // Add image to embed
      embed.image = {
        url: 'attachment://' + image.name
      }
      
      // Discord webhook with file upload
      const discordFormData = new FormData()
      discordFormData.append('payload_json', JSON.stringify(discordPayload))
      discordFormData.append('file', image, image.name)
      
      const response = await fetch(discordWebhookUrl, {
        method: 'POST',
        body: discordFormData
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

// Parse user agent for better browser/OS information
function parseUserAgent(userAgent: string): { browser: string; os: string; device: string } {
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  // Browser detection using array of objects
  const browsers: Array<{ name: string; pattern: string }> = [
    { name: 'Chrome', pattern: 'Chrome' },
    { name: 'Firefox', pattern: 'Firefox' },
    { name: 'Safari', pattern: 'Safari' },
    { name: 'Edge', pattern: 'Edge' },
    { name: 'Opera', pattern: 'Opera' }
  ]

  // OS detection using array of objects
  const operatingSystems: Array<{ name: string; pattern?: string; patterns?: string[]; device: string }> = [
    { name: 'Windows', pattern: 'Windows', device: 'Desktop' },
    { name: 'macOS', patterns: ['Mac OS X', 'Macintosh'], device: 'Desktop' },
    { name: 'Linux', pattern: 'Linux', device: 'Desktop' },
    { name: 'Android', pattern: 'Android', device: 'Mobile' },
    { name: 'iOS', patterns: ['iPhone', 'iPad'], device: 'Mobile' }
  ]

  // Find browser
  for (const browserInfo of browsers) {
    if (userAgent.includes(browserInfo.pattern)) {
      browser = browserInfo.name
      break
    }
  }

  // Find OS and device
  for (const osInfo of operatingSystems) {
    if ('patterns' in osInfo && osInfo.patterns) {
      // Handle multiple patterns (like macOS)
      for (const pattern of osInfo.patterns) {
        if (userAgent.includes(pattern)) {
          os = osInfo.name
          device = osInfo.device
          // Special case for iPad
          if (pattern === 'iPad') {
            device = 'Tablet'
          }
          break
        }
      }
    } else if (osInfo.pattern && userAgent.includes(osInfo.pattern)) {
      os = osInfo.name
      device = osInfo.device
      break
    }
    
    if (os !== 'Unknown') break
  }

  return { browser, os, device }
}
