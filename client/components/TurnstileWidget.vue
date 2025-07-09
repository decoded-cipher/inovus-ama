<template>
  <div class="turnstile-container">
    <NuxtTurnstile
      ref="turnstile"
      v-model="token"
      :options="turnstileOptions"
      @verify="handleVerify"
      @error="handleError"
      @expire="handleExpire"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  size: 'normal',
  disabled: false
})

const emit = defineEmits<{
  verified: [token: string]
  error: [error: string]
  expired: []
}>()

const token = ref<string>('')
const turnstile = ref()

const turnstileOptions = computed(() => ({
  theme: props.theme,
  size: props.size,
  'refresh-expired': 'auto',
  'retry-interval': 8000,
}))

const handleVerify = (token: string) => {
  emit('verified', token)
}

const handleError = (error: string) => {
  emit('error', error)
}

const handleExpire = () => {
  token.value = ''
  emit('expired')
}

const reset = () => {
  if (turnstile.value) {
    turnstile.value.reset()
  }
  token.value = ''
}

const getToken = () => {
  return token.value
}

defineExpose({
  reset,
  getToken
})
</script>

<style scoped>
.turnstile-container {
  display: flex;
  justify-content: center;
  margin: 0.5rem 0;
}

.turnstile-container :deep(.cf-turnstile) {
  margin: 0 auto;
}
</style>
