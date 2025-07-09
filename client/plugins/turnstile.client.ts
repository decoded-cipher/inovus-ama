export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client-side
  if (process.server) return

  // Add global error handler for Turnstile-related errors
  nuxtApp.hook('app:error', (error) => {
    if (error.statusCode === 403 && error.statusMessage?.includes('Turnstile')) {
      // Handle Turnstile verification failures
      console.warn('Turnstile verification failed:', error.statusMessage)
    }
  })

  // Add global method to check if Turnstile is enabled
  return {
    provide: {
      turnstileEnabled: () => {
        const config = useRuntimeConfig()
        return !!(config.public.turnstile?.siteKey)
      }
    }
  }
})
