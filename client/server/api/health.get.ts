export default defineEventHandler(async (event) => {

    // Get server URL from runtime config
    const config = useRuntimeConfig()
    const serverUrl = config.public.serverUrl
    
    if (!serverUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server URL is not configured'
      })
    }

    try {
        const response = await $fetch(`${serverUrl}?_=${Date.now()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        return response
    } catch (error) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Internal Server Error',
            data: error.data || 'An unexpected error occurred'
        })
    }
})