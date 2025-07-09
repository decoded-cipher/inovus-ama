import { ref, computed } from 'vue'

interface TurnstileState {
  token: string
  verified: boolean
  error: string | null
  required: boolean
}

const turnstileState = ref<TurnstileState>({
  token: '',
  verified: false,
  error: null,
  required: false
})

export const useTurnstile = () => {
  const isVerified = computed(() => turnstileState.value.verified)
  const hasError = computed(() => !!turnstileState.value.error)
  const isRequired = computed(() => turnstileState.value.required)
  const token = computed(() => turnstileState.value.token)

  const setVerified = (tokenValue: string) => {
    turnstileState.value = {
      token: tokenValue,
      verified: true,
      error: null,
      required: turnstileState.value.required
    }
  }

  const setError = (error: string) => {
    turnstileState.value = {
      token: '',
      verified: false,
      error,
      required: turnstileState.value.required
    }
  }

  const setRequired = (required: boolean) => {
    turnstileState.value.required = required
    if (!required) {
      // If not required, clear any verification state
      turnstileState.value.token = ''
      turnstileState.value.verified = false
      turnstileState.value.error = null
    }
  }

  const reset = () => {
    turnstileState.value = {
      token: '',
      verified: false,
      error: null,
      required: turnstileState.value.required
    }
  }

  const expire = () => {
    turnstileState.value.token = ''
    turnstileState.value.verified = false
    turnstileState.value.error = null
  }

  return {
    // State
    isVerified,
    hasError,
    isRequired,
    token,
    error: computed(() => turnstileState.value.error),
    
    // Actions
    setVerified,
    setError,
    setRequired,
    reset,
    expire
  }
}
