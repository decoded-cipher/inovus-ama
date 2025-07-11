<template>
  <div class="flex-1 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 flex flex-col min-h-0 border border-slate-200/60 shadow-sm">
    <!-- Messages -->
    <div class="flex-1 space-y-3 sm:space-y-4 mb-3 sm:mb-4 overflow-y-auto" ref="messagesContainer">
      <ChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />

      <ChatLoadingMessage v-if="isLoading" />
    </div>

    <!-- Input -->
    <div class="bg-white/80 backdrop-blur-sm rounded sm:rounded-xl border border-slate-200/60 p-2.5 sm:p-3 shadow-sm">
      
      <!-- Turnstile Widget -->
      <div v-if="isRequired" class="absolute -z-10">
        <TurnstileWidget
          ref="turnstileWidget"
          theme="light"
          size="compact"
          @verified="handleTurnstileVerified"
          @error="handleTurnstileError"
          @expired="handleTurnstileExpired"
        />
      </div>
      
      <form @submit.prevent="handleSubmit" class="flex items-center space-x-2 sm:space-x-3">
        <input
          :value="input"
          :disabled="isLoading || isOffline"
          :placeholder="isOffline ? 'Service is offline. Please wait...' : 'Ask InoBot anything about Inovus Labs...'"
          :class="[
            'flex-1 border-0 bg-transparent focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-500 text-sm outline-none',
            isOffline && 'cursor-not-allowed opacity-60'
          ]"
          @input="$emit('update:input', ($event.target as HTMLInputElement).value)"
        />
        <button
          type="submit"
          :disabled="!input.trim() || isLoading || isOffline"
          :class="[
            'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-2 rounded transition-all duration-200 flex-shrink-0 shadow-lg shadow-blue-500/25',
            (isLoading || isOffline || !input.trim()) && 'opacity-50 cursor-not-allowed'
          ]"
        >
          <Icon name="lucide:send" class="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </form>
      
      <!-- Turnstile Error -->
      <div v-if="hasError" class="mt-2 p-2 bg-red-50 border border-red-200 rounded">
        <div class="flex items-center space-x-2">
          <Icon name="lucide:shield-alert" class="w-4 h-4 text-red-600" />
          <span class="text-sm text-red-700">
            {{ error }}
          </span>
        </div>
      </div>
      
      <!-- Offline Notice -->
      <div v-if="isOffline" class="mt-2 p-2 bg-red-50 border border-red-200 rounded">
        <div class="flex items-center space-x-2">
          <Icon name="lucide:wifi-off" class="w-4 h-4 text-red-600" />
          <span class="text-sm text-red-700">
            Service is currently offline. Please wait for the connection to be restored.
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useTurnstile } from '~/composables/useTurnstile'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Props {
  messages: Message[]
  isLoading: boolean
  input: string
  isOffline?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:input': [value: string]
  'submit': [turnstileToken?: string]
}>()

const messagesContainer = ref<HTMLElement>()
const turnstileWidget = ref()

const {
  isVerified,
  hasError,
  isRequired,
  token,
  error,
  setVerified,
  setError,
  setRequired,
  reset,
  expire
} = useTurnstile()

// Auto-scroll to bottom when new messages are added
watch(() => props.messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })

// Show Turnstile for first 3 interactions or randomly for security
watch(() => props.messages.length, (newLength) => {
  if (newLength <= 6) { // First 3 conversations (user + assistant = 2 messages each)
    setRequired(true)
  } else {
    // Show randomly for additional security (20% chance)
    setRequired(Math.random() < 0.2)
  }
})

const handleTurnstileVerified = (tokenValue: string) => {
  setVerified(tokenValue)
}

const handleTurnstileError = (errorMessage: string) => {
  console.error('Turnstile error:', errorMessage)
  setError('Security verification failed. Please try again.')
}

const handleTurnstileExpired = () => {
  expire()
}

const handleSubmit = () => {
  if (isRequired.value && !isVerified.value) {
    setError('Please complete the security verification.')
    return
  }
  
  emit('submit', token.value)
  
  // Reset Turnstile after successful submission
  if (turnstileWidget.value) {
    turnstileWidget.value.reset()
  }
  reset()
}
</script>
