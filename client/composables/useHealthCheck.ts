import { ref, onMounted, onUnmounted, readonly } from 'vue'

export interface HealthStatus {
  isOnline: boolean
  isChecking: boolean
  lastChecked: Date | null
  error: string | null
}

// Global state - shared across all components
const globalStatus = ref<HealthStatus>({
  isOnline: false,
  isChecking: false,
  lastChecked: null,
  error: null
})

let globalIntervalId: NodeJS.Timeout | null = null
let instanceCount = 0

export function useHealthCheck() {

  const checkHealth = async () => {
    try {
      globalStatus.value.isChecking = true
      globalStatus.value.error = null

      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        globalStatus.value.isOnline = data.status === 'ok' || data.healthy === true || response.status === 200
      } else {
        globalStatus.value.isOnline = false
        globalStatus.value.error = `Health check failed: ${response.status}`
      }
    } catch (error) {
      globalStatus.value.isOnline = false
      if (error instanceof Error) {
        globalStatus.value.error = error.message
      } else {
        globalStatus.value.error = 'Unknown error occurred'
      }
    } finally {
      globalStatus.value.isChecking = false
      globalStatus.value.lastChecked = new Date()
    }
  }

  const startHealthCheck = () => {
    // Only start interval if it's not already running
    if (!globalIntervalId) {
      // Initial check
      checkHealth()
      
      // Set up interval for every 30 seconds
      globalIntervalId = setInterval(checkHealth, 30000)
    }
  }

  const stopHealthCheck = () => {
    if (globalIntervalId) {
      clearInterval(globalIntervalId)
      globalIntervalId = null
    }
  }

  // Auto-start on mount
  onMounted(() => {
    instanceCount++
    startHealthCheck()
  })

  // Clean up on unmount
  onUnmounted(() => {
    instanceCount--
    // Only stop health check when no components are using it
    if (instanceCount === 0) {
      stopHealthCheck()
    }
  })

  return {
    status: readonly(globalStatus),
    checkHealth,
    startHealthCheck,
    stopHealthCheck
  }
}
