<template>
  <!-- Modal Overlay -->
  <div 
    v-if="isOpen" 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click="closeModal"
  >
    <!-- Modal Content -->
    <div 
      class="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden fade-in-up"
      @click.stop
    >
      <!-- Header -->
      <div :class="[
        'px-6 py-4',
        feedbackType === 'bug' 
          ? 'bg-red-600' 
          : 'bg-blue-600'
      ]">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Icon name="lucide:message-circle" class="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-white">Share Feedback</h2>
              <p class="text-blue-100 text-sm">Help us improve InoBot</p>
            </div>
          </div>
          <button 
            @click="closeModal"
            class="text-white/80 hover:text-white transition-colors px-2 py-1.5 rounded-full hover:bg-white/20"
          >
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Success/Error States -->
      <div v-if="submissionState === 'success'" class="p-6 text-center">
        <div :class="[
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
          feedbackType === 'bug' 
            ? 'bg-red-100' 
            : 'bg-green-100'
        ]">
          <Icon name="lucide:check-circle" :class="[
            'w-8 h-8',
            feedbackType === 'bug' 
              ? 'text-red-600' 
              : 'text-green-600'
          ]" />
        </div>
        <h3 class="text-xl font-semibold text-slate-800 mb-2">Thank You!</h3>
        <p class="text-slate-600 mb-6">Your feedback has been submitted successfully. We'll review it and get back to you if needed.</p>
        <button
          @click="closeModal"
          :class="[
            'px-6 py-2.5 text-white text-sm font-semibold rounded transition-all duration-200',
            feedbackType === 'bug'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          ]"
        >
          Close
        </button>
      </div>

      <div v-else-if="submissionState === 'error'" class="p-6 text-center">
        <div :class="[
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
          feedbackType === 'bug' 
            ? 'bg-red-100' 
            : 'bg-red-100'
        ]">
          <Icon name="lucide:alert-circle" :class="[
            'w-8 h-8',
            feedbackType === 'bug' 
              ? 'text-red-600' 
              : 'text-red-600'
          ]" />
        </div>
        <h3 class="text-xl font-semibold text-slate-800 mb-2">Submission Failed</h3>
        <p class="text-slate-600 mb-6">{{ errorMessage || 'Something went wrong. Please try again.' }}</p>
        <div class="flex space-x-3 justify-center">
          <button
            @click="resetSubmissionState"
            :class="[
              'px-6 py-2.5 text-white text-sm font-semibold rounded transition-all duration-200',
              feedbackType === 'bug'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            ]"
          >
            Try Again
          </button>
          <button
            @click="closeModal"
            class="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded transition-all duration-200 border border-slate-200 hover:border-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Form Content -->
      <div v-else class="p-6 max-h-[60vh] overflow-y-auto">
        <form @submit.prevent="submitFeedback" class="space-y-4">
          <!-- Feedback Type -->
          <div class="bg-slate-50 border border-slate-200 rounded p-4">
            <label class="block text-sm font-semibold text-slate-700 mb-2">Feedback Type</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                :class="[
                  'p-4 rounded border transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md',
                  feedbackType === 'bug' 
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-red-100' 
                    : 'border-slate-200 hover:border-red-300 text-slate-600 hover:bg-red-50 hover:shadow-red-50'
                ]"
                @click="feedbackType = 'bug'"
              >
                <div class="flex flex-col items-center space-y-2">
                  <Icon name="lucide:bug" class="w-5 h-5" />
                  <span>Bug Report</span>
                  <p class="text-xs text-slate-500">Report an issue or problem</p>
                </div>
              </button>
              <button
                type="button"
                :class="[
                  'p-4 rounded border transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md',
                  feedbackType === 'suggestion' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-blue-100' 
                    : 'border-slate-200 hover:border-blue-300 text-slate-600 hover:bg-blue-50 hover:shadow-blue-50'
                ]"
                @click="feedbackType = 'suggestion'"
              >
                <div class="flex flex-col items-center space-y-2">
                  <Icon name="lucide:lightbulb" class="w-5 h-5" />
                  <span>Suggestion</span>
                  <p class="text-xs text-slate-500">Share an idea or improvement</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Subject -->
          <div class="bg-slate-50 border border-slate-200 rounded p-4">
            <label for="subject" class="block text-sm font-semibold text-slate-700 mb-2">
              Subject <span class="text-red-500">*</span>
            </label>
            <input
              id="subject"
              v-model="subject"
              type="text"
              required
              placeholder="Brief description of your feedback"
              class="w-full px-3 py-2 border border-slate-200 rounded outline-none transition-colors text-sm bg-white/80"
            />
            <p class="text-xs text-slate-500 mt-2">
              Keep it concise but descriptive (e.g., "Chat response is too slow" or "Add dark mode support")
            </p>
          </div>

          <!-- Description -->
          <div class="bg-slate-50 border border-slate-200 rounded p-4">
            <label for="description" class="block text-sm font-semibold text-slate-700 mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              v-model="description"
              required
              rows="4"
              placeholder="Please provide detailed information about your feedback..."
              class="w-full px-3 py-2 border border-slate-200 rounded outline-none transition-colors text-sm resize-none bg-white/80"
            ></textarea>
            <p class="text-xs text-slate-500 mt-2">
              Include steps to reproduce (for bugs) or explain your idea in detail (for suggestions)
            </p>
          </div>

          <!-- Image Upload -->
          <div class="bg-slate-50 border border-slate-200 rounded p-4">
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Attach Image (Optional)
            </label>
            <div class="space-y-3">
              <!-- Upload Area -->
              <div
                :class="[
                  'border border-dashed rounded p-4 text-center transition-all duration-200 cursor-pointer',
                  isDragOver 
                    ? feedbackType === 'bug' 
                      ? 'border-red-500 bg-red-50 shadow-md' 
                      : 'border-blue-500 bg-blue-50 shadow-md'
                    : feedbackType === 'bug'
                      ? 'border-slate-200 hover:border-red-300 hover:bg-red-50 hover:shadow-sm'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                ]"
                @click="triggerFileInput"
                @dragover.prevent="isDragOver = true"
                @dragleave.prevent="isDragOver = false"
                @drop.prevent="handleFileDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileSelect"
                />
                <div v-if="!selectedImage" class="space-y-2">
                  <Icon name="lucide:upload" class="w-8 h-8 text-slate-400 mx-auto" />
                  <div class="text-sm text-slate-600">
                    <span :class="[
                      'font-medium',
                      feedbackType === 'bug' 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    ]">Click to upload</span> or drag and drop
                  </div>
                  <p class="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                  <p class="text-xs text-slate-400 mt-1">Screenshots help us understand your feedback better</p>
                </div>
                
                <!-- Image Preview -->
                <div v-else class="space-y-2">
                  <img 
                    :src="imagePreview" 
                    :alt="selectedImage.name"
                    class="max-h-32 mx-auto rounded shadow-sm"
                  />
                  <div class="flex items-center justify-center space-x-2 text-sm text-slate-600">
                    <span>{{ selectedImage.name }}</span>
                    <button
                      type="button"
                      @click.stop="removeImage"
                      class="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Icon name="lucide:x" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Info (Optional) -->
          <div class="bg-slate-50 border border-slate-200 rounded p-4">
            <label for="contact" class="block text-sm font-semibold text-slate-700 mb-2">
              Contact Info (Optional)
            </label>
            <input
              id="contact"
              v-model="contact"
              type="text"
              placeholder="Email or Discord username for follow-up"
              class="w-full px-3 py-2 border border-slate-200 rounded outline-none transition-colors text-sm bg-white/80"
            />
            <p class="text-xs text-slate-500 mt-2">
              Provide your contact information if you'd like us to follow up on your feedback.
            </p>
          </div>

          <!-- Turnstile Protection (Hidden but functional) -->
          <div class="hidden">
            <TurnstileWidget
              ref="turnstileRef"
              theme="light"
              size="normal"
              @verified="handleTurnstileVerified"
              @error="handleTurnstileError"
              @expired="handleTurnstileExpired"
            />
          </div>

          <!-- Form Submission Note -->
          <div :class="[
            'border rounded p-4',
            feedbackType === 'bug' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-blue-50 border-blue-200'
          ]">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 mt-0.5">
                <div :class="[
                  'w-5 h-5 rounded-full flex items-center justify-center',
                  feedbackType === 'bug' 
                    ? 'bg-red-100' 
                    : 'bg-blue-100'
                ]">
                  <Icon name="lucide:shield-check" :class="[
                    'w-3 h-3',
                    feedbackType === 'bug' 
                      ? 'text-red-600' 
                      : 'text-blue-600'
                  ]" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p :class="[
                  'text-xs leading-relaxed',
                  feedbackType === 'bug' 
                    ? 'text-red-700' 
                    : 'text-blue-700'
                ]">
                  Your feedback will be securely sent to our Discord server where our team can review and respond promptly. 
                  <span class="font-medium">All submissions are protected by security measures.</span>
                </p>
              </div>
            </div>
          </div>

        </form>
      </div>

      <!-- Footer -->
      <div v-if="submissionState === 'form'" :class="[
        'backdrop-blur-sm border-t border-slate-200/80 px-6 py-5 bg-white/80'
      ]">
        <!-- Action Buttons -->
        <div class="flex items-center justify-end pt-1">
          <div class="flex items-center space-x-3">
            <button
              type="button"
              @click="closeModal"
              :disabled="isSubmitting"
              class="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded transition-all duration-200 border border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              :aria-label="isSubmitting ? 'Cannot cancel while submitting' : 'Cancel feedback submission'"
            >
              <span>Cancel</span>
            </button>
            <button
              @click="submitFeedback"
              :disabled="!canSubmit || isSubmitting"
              :class="[
                'group px-6 py-2.5 text-white text-sm font-semibold rounded transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:transform-none',
                feedbackType === 'bug'
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-slate-400'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400'
              ]"
              :aria-label="isSubmitting ? 'Submitting feedback...' : 'Submit your feedback'"
            >
              <Icon 
                v-if="isSubmitting" 
                name="lucide:loader-2" 
                class="w-4 h-4 animate-spin" 
              />
              <Icon 
                v-else-if="canSubmit" 
                name="lucide:send" 
                class="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" 
              />
              <Icon 
                v-else 
                name="lucide:alert-circle" 
                class="w-4 h-4" 
              />
              <span>{{ isSubmitting ? 'Sending...' : canSubmit ? 'Send Feedback' : 'Complete Form' }}</span>
            </button>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'submitted': []
}>()

// Turnstile integration - Create separate instance for feedback modal
const feedbackTurnstileState = ref({
  token: '',
  verified: false,
  error: null as string | null
})

const isVerified = computed(() => feedbackTurnstileState.value.verified)

const setVerified = (tokenValue: string) => {
  feedbackTurnstileState.value = {
    token: tokenValue,
    verified: true,
    error: null
  }
}

const setError = (error: string) => {
  feedbackTurnstileState.value = {
    token: '',
    verified: false,
    error
  }
}

const resetTurnstile = () => {
  feedbackTurnstileState.value = {
    token: '',
    verified: false,
    error: null
  }
}

const turnstileRef = ref()

// Form data
const feedbackType = ref<'bug' | 'suggestion'>('suggestion')
const subject = ref('')
const description = ref('')
const contact = ref('')
const selectedImage = ref<File | null>(null)
const imagePreview = ref<string | undefined>(undefined)
const isSubmitting = ref(false)
const isDragOver = ref(false)

// Submission state
const submissionState = ref<'form' | 'success' | 'error'>('form')
const errorMessage = ref<string>('')

// File input ref
const fileInput = ref<HTMLInputElement>()

// Computed
const canSubmit = computed(() => {
  // Allow submission if form is filled and either verified or Turnstile is not available
  const subjectValid = Boolean(subject.value.trim())
  const descriptionValid = Boolean(description.value.trim())
  const formValid = subjectValid && descriptionValid && !isSubmitting.value
  
  const config = useRuntimeConfig()
  const turnstileAvailable = config.public.turnstile && (config.public.turnstile as any).siteKey
  
  // If Turnstile is not available, allow submission
  if (!turnstileAvailable) {
    return formValid
  }
  
  // If Turnstile is available, require verification OR allow after timeout
  return formValid && (isVerified.value || feedbackTurnstileState.value.token === 'delayed-verification')
})

const turnstileAvailable = computed(() => {
  const config = useRuntimeConfig()
  return !!(config.public.turnstile && (config.public.turnstile as any).siteKey)
})

// Turnstile event handlers
const handleTurnstileVerified = (token: string) => {
  console.log('Turnstile verified with token:', token)
  setVerified(token)
}

const handleTurnstileError = (error: string) => {
  console.warn('Turnstile error:', error)
  setError(error)
  // Fallback: allow submission after error
  setTimeout(() => {
    if (!isVerified.value) {
      console.log('Enabling submission after Turnstile error')
      setVerified('error-fallback')
    }
  }, 1000)
}

const handleTurnstileExpired = () => {
  console.log('Turnstile expired')
  setError('Verification expired')
  // Auto-retry after expiration
  setTimeout(() => {
    if (turnstileRef.value && turnstileRef.value.turnstile) {
      try {
        turnstileRef.value.turnstile.execute()
      } catch (error) {
        console.warn('Turnstile retry failed:', error)
        // Fallback: allow submission
        setVerified('expired-fallback')
      }
    } else {
      setVerified('expired-fallback')
    }
  }, 500)
}

// Auto-verify Turnstile when modal opens
const autoVerifyTurnstile = () => {
  console.log('Starting Turnstile auto-verification...')
  
  // First, check if Turnstile is available
  const config = useRuntimeConfig()
  const turnstileAvailable = config.public.turnstile && (config.public.turnstile as any).siteKey
  
  if (!turnstileAvailable) {
    console.log('Turnstile not available, enabling submission')
    setVerified('fallback-verified')
    return
  }
  
  // Wait for the widget to be ready
  setTimeout(() => {
    try {
      if (turnstileRef.value && turnstileRef.value.turnstile) {
        console.log('Turnstile widget ready, executing...')
        // Trigger Turnstile verification automatically
        if (typeof turnstileRef.value.turnstile.execute === 'function') {
          turnstileRef.value.turnstile.execute()
        }
      } else {
        console.warn('Turnstile widget not ready')
      }
    } catch (error) {
      console.warn('Turnstile auto-verification failed:', error)
    }
  }, 1000)
  
  // Fallback: if verification doesn't happen within a reasonable time, enable submission
  setTimeout(() => {
    if (!isVerified.value) {
      console.log('Turnstile verification timeout, enabling submission as fallback')
      setVerified('delayed-verification')
    }
  }, 3000)
}

// Methods
const closeModal = () => {
  if (!isSubmitting.value) {
    resetForm()
    emit('close')
  }
}

const resetForm = () => {
  feedbackType.value = 'suggestion'
  subject.value = ''
  description.value = ''
  contact.value = ''
  selectedImage.value = null
  imagePreview.value = undefined
  isSubmitting.value = false
  isDragOver.value = false
  submissionState.value = 'form'
  errorMessage.value = ''
  resetTurnstile()
  if (turnstileRef.value) {
    turnstileRef.value.reset()
  }
}

const resetSubmissionState = () => {
  submissionState.value = 'form'
  errorMessage.value = ''
  resetTurnstile()
  if (turnstileRef.value) {
    turnstileRef.value.reset()
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

const processFile = (file: File) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB')
    return
  }

  selectedImage.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  selectedImage.value = null
  imagePreview.value = undefined
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const submitFeedback = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true

  try {
    const formData = new FormData()
    formData.append('type', feedbackType.value === 'bug' ? 'bug' : 'improvement')
    formData.append('subject', subject.value.trim())
    formData.append('description', description.value.trim())
    if (contact.value.trim()) {
      formData.append('contactEmail', contact.value.trim())
    }
    if (selectedImage.value) {
      formData.append('image', selectedImage.value)
    }
    
    // Add Turnstile token for verification
    const config = useRuntimeConfig()
    const turnstileAvailable = config.public.turnstile && (config.public.turnstile as any).siteKey
    
    if (turnstileAvailable && isVerified.value && feedbackTurnstileState.value.token) {
      // Check if it's a fallback token that should be sent
      const token = feedbackTurnstileState.value.token
      if (token && !token.startsWith('fallback-') && !token.startsWith('delayed-') && !token.startsWith('error-') && !token.startsWith('expired-')) {
        formData.append('cf-turnstile-response', token)
      } else {
        // For fallback tokens, we'll still submit but without the token
        console.log('Using fallback verification, submitting without Turnstile token')
      }
    } else if (turnstileAvailable && !isVerified.value) {
      throw new Error('Security verification required. Please wait a moment and try again.')
    }

    const response = await fetch('/api/feedback', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `HTTP ${response.status}: ${response.statusText}`)
    }

    // Show success state
    submissionState.value = 'success'
    emit('submitted')
    
  } catch (error: any) {
    console.error('Error submitting feedback:', error)
    errorMessage.value = error.message || 'Failed to submit feedback. Please try again.'
    submissionState.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

// Reset form when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetForm()
  } else {
    // Auto-verify Turnstile when modal opens
    setTimeout(() => {
      autoVerifyTurnstile()
    }, 100)
  }
})
</script>
  