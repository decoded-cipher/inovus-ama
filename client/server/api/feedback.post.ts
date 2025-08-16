import { defineEventHandler, createError, readFormData, getHeader } from 'h3'
import { getClientIP } from '../utils'

// Constants
const VALID_FEEDBACK_TYPES = ['bug', 'improvement'] as const
const MAX_SUBJECT_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_CONTACT_LENGTH = 100
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

type FeedbackType = typeof VALID_FEEDBACK_TYPES[number]

interface FeedbackData {
  type: FeedbackType
  subject: string
  description: string
  contactEmail?: string
  image?: File
}

// Validation helpers
const validateString = (value: unknown, maxLength: number, fieldName: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} is required`
    })
  }
  
  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} must be ${maxLength} characters or less`
    })
  }
  
  return trimmed
}

const validateFeedbackType = (type: unknown): FeedbackType => {
  if (!VALID_FEEDBACK_TYPES.includes(type as FeedbackType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid feedback type'
    })
  }
  return type as FeedbackType
}

const validateImage = (image: unknown): File | undefined => {
  if (!image) return undefined
  
  if (!(image instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid image format'
    })
  }
  
  if (image.size > MAX_IMAGE_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image size must be less than 5MB'
    })
  }
  
  if (!image.type.startsWith('image/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File must be an image'
    })
  }
  
  return image
}

// Extract and validate form data
const extractFeedbackData = async (formData: FormData): Promise<FeedbackData> => {
  const type = validateFeedbackType(formData.get('type'))
  const subject = validateString(formData.get('subject'), MAX_SUBJECT_LENGTH, 'Subject')
  const description = validateString(formData.get('description'), MAX_DESCRIPTION_LENGTH, 'Description')
  const image = validateImage(formData.get('image'))
  
  let contactEmail: string | undefined
  const contactValue = formData.get('contactEmail')
  if (contactValue && typeof contactValue === 'string') {
    contactEmail = contactValue.trim()
    if (contactEmail.length > MAX_CONTACT_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: `Contact info must be ${MAX_CONTACT_LENGTH} characters or less`
      })
    }
  }
  
  return { type, subject, description, contactEmail, image }
}

export default defineEventHandler(async (event) => {
  try {
    const formData = await readFormData(event)
    const feedbackData = await extractFeedbackData(formData)
    const config = useRuntimeConfig(event)
    
    // Verify Turnstile token if provided
    const turnstileToken = formData.get('cf-turnstile-response') as string | null
    await verifyTurnstileToken(turnstileToken, config, event)
    
    // Send to Discord
    await sendToDiscord(feedbackData, config, event)
    
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

// Turnstile verification
const verifyTurnstileToken = async (token: string | null, config: any, event: any): Promise<void> => {
  if (!token || !config.turnstileSecretKey) {
    return // Skip verification if no token or secret
  }
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: config.turnstileSecretKey,
        response: token,
        remoteip: getClientIP(event) || 'unknown'
      })
    })
    
    const result = await response.json()
    // Don't throw on failure - just log for monitoring
    if (!result.success && process.env.NODE_ENV === 'development') {
      console.warn('Turnstile verification failed:', result['error-codes'])
    }
  } catch (error) {
    // Silent fail - don't block legitimate submissions
  }
}

// Send feedback to Discord
const sendToDiscord = async (feedbackData: FeedbackData, config: any, event: any): Promise<void> => {
  const discordWebhookUrl = config.discordWebhookUrl
  if (!discordWebhookUrl) {
    console.error('Discord webhook URL not configured')
    throw createError({
      statusCode: 500,
      statusMessage: 'Feedback service not configured'
    })
  }

  const embed = createDiscordEmbed(feedbackData, event)
  const payload = {
    embeds: [embed],
    username: 'InoBot Feedback',
    avatar_url: 'https://ama.inovuslabs.org/icon-192.png'
  }

  try {
    if (feedbackData.image) {
      await sendDiscordWithImage(discordWebhookUrl, payload, feedbackData.image)
    } else {
      await sendDiscordMessage(discordWebhookUrl, payload)
    }
  } catch (error) {
    console.error('Discord webhook failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send feedback'
    })
  }
}

// Create optimized Discord embed
const createDiscordEmbed = (feedbackData: FeedbackData, event: any) => {
  const { type, subject, description, contactEmail } = feedbackData
  const userAgent = getHeader(event, 'user-agent') || 'Unknown'
  const clientInfo = parseUserAgent(userAgent)
  const networkInfo = getNetworkInfo(event)

  const embed: any = {
    title: `${getFeedbackEmoji(type)} ${type === 'bug' ? 'Bug Report' : 'Improvement Suggestion'}`,
    description: `**${subject}**\n\n${description}`,
    color: getFeedbackColor(type),
    fields: [
      {
        name: '💻 Environment',
        value: `**${clientInfo.browser}** on **${clientInfo.os}** (${clientInfo.device})`,
        inline: false
      }
    ],
    footer: { text: 'InoBot Feedback System' },
    timestamp: new Date().toISOString()
  }

  if (networkInfo.length > 0) {
    embed.fields.push({
      name: '🌍 Network & Location',
      value: networkInfo.join('\n'),
      inline: false
    })
  }

  if (contactEmail) {
    embed.fields.push({
      name: '📧 Contact',
      value: contactEmail,
      inline: false
    })
  }

  return embed
}

// Network information helper
const getNetworkInfo = (event: any): string[] => {
  const info: string[] = []
  const headers = [
    { key: 'cf-ipcountry', label: 'Country' },
    { key: 'cf-colo', label: 'Data Center' },
    { key: 'cf-ray', label: 'CF Ray' }
  ]

  headers.forEach(({ key, label }) => {
    const value = getHeader(event, key)
    if (value && value !== 'Unknown') {
      info.push(`**${label}:** ${value}`)
    }
  })

  const clientIP = getClientIP(event)
  if (clientIP) {
    info.push(`**IP:** ${clientIP}`)
  }

  return info
}

// Send Discord message without image
const sendDiscordMessage = async (webhookUrl: string, payload: any): Promise<void> => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
}

// Send Discord message with image
const sendDiscordWithImage = async (webhookUrl: string, payload: any, image: File): Promise<void> => {
  // Add image reference to embed
  payload.embeds[0].image = { url: `attachment://${image.name}` }

  const formData = new FormData()
  formData.append('payload_json', JSON.stringify(payload))
  formData.append('file', image, image.name)

  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
}

// Helper functions
const getFeedbackColor = (type: FeedbackType): number => ({
  bug: 0xFF0000,
  improvement: 0x0099FF
})[type]

const getFeedbackEmoji = (type: FeedbackType): string => ({
  bug: '🐛',
  improvement: '✨'
})[type]

// Optimized user agent parser
const parseUserAgent = (userAgent: string): { browser: string; os: string; device: string } => {
  const browsers = [
    { name: 'Chrome', test: /Chrome\/[\d.]+/ },
    { name: 'Firefox', test: /Firefox\/[\d.]+/ },
    { name: 'Safari', test: /Safari\/[\d.]+/ },
    { name: 'Edge', test: /Edge\/[\d.]+/ },
    { name: 'Opera', test: /Opera\/[\d.]+/ }
  ]

  const systems = [
    { name: 'Windows', test: /Windows/, device: 'Desktop' },
    { name: 'macOS', test: /Mac OS X/, device: 'Desktop' },
    { name: 'Linux', test: /Linux/, device: 'Desktop' },
    { name: 'Android', test: /Android/, device: 'Mobile' },
    { name: 'iOS', test: /iPhone|iPad/, device: 'Mobile' }
  ]

  const browser = browsers.find(b => b.test.test(userAgent))?.name || 'Unknown'
  const system = systems.find(s => s.test.test(userAgent))
  const os = system?.name || 'Unknown'
  const device = userAgent.includes('iPad') ? 'Tablet' : (system?.device || 'Desktop')

  return { browser, os, device }
}
