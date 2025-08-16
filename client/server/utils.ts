import type { H3Event } from 'h3'

/**
 * Extract client IP address from the request event
 * Handles various proxy headers and fallbacks
 */
export function getClientIP(event: H3Event): string | null {
  // Check for Cloudflare headers first
  const cfConnectingIP = getHeader(event, 'cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Check for X-Forwarded-For header
  const xForwardedFor = getHeader(event, 'x-forwarded-for')
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const firstIP = xForwardedFor.split(',')[0].trim()
    if (firstIP) {
      return firstIP
    }
  }

  // Check for X-Real-IP header
  const xRealIP = getHeader(event, 'x-real-ip')
  if (xRealIP) {
    return xRealIP
  }

  // Check for X-Client-IP header
  const xClientIP = getHeader(event, 'x-client-ip')
  if (xClientIP) {
    return xClientIP
  }

  // Fallback to connection remote address
  const connection = event.node.req.socket
  if (connection?.remoteAddress) {
    return connection.remoteAddress
  }

  return null
}
