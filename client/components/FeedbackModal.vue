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
        formData.type === 'bug' 
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
      <div v-if="uiState.submissionState === 'success'" class="p-6 text-center">
        <div :class="[
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
          formData.type === 'bug' 
            ? 'bg-red-100' 
            : 'bg-green-100'
        ]">
          <Icon name="lucide:check-circle" :class="[
            'w-8 h-8',
            formData.type === 'bug' 
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
            formData.type === 'bug'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          ]"
        >
          Close
        </button>
      </div>

      <div v-else-if="uiState.submissionState === 'error'" class="p-6 text-center">
        <div :class="[
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
          formData.type === 'bug' 
            ? 'bg-red-100' 
            : 'bg-red-100'
        ]">
          <Icon name="lucide:alert-circle" :class="[
            'w-8 h-8',
            formData.type === 'bug' 
              ? 'text-red-600' 
              : 'text-red-600'
          ]" />
        </div>
        <h3 class="text-xl font-semibold text-slate-800 mb-2">Submission Failed</h3>
        <p class="text-slate-600 mb-6">{{ uiState.errorMessage || 'Something went wrong. Please try again.' }}</p>
        <div class="flex space-x-3 justify-center">
          <button
            @click="resetSubmissionState"
            :class="[
              'px-6 py-2.5 text-white text-sm font-semibold rounded transition-all duration-200',
              formData.type === 'bug'
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
                  formData.type === 'bug' 
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-red-100' 
                    : 'border-slate-200 hover:border-red-300 text-slate-600 hover:bg-red-50 hover:shadow-red-50'
                ]"
                @click="formData.type = 'bug'"
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
                  formData.type === 'suggestion' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-blue-100' 
                    : 'border-slate-200 hover:border-blue-300 text-slate-600 hover:bg-blue-50 hover:shadow-blue-50'
                ]"
                @click="formData.type = 'suggestion'"
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
              v-model="formData.subject"
              type="text"
              required
              :maxlength="MAX_SUBJECT_LENGTH"
              placeholder="Brief description of your feedback"
              class="w-full px-3 py-2 border border-slate-200 rounded outline-none transition-colors text-sm bg-white/80"
              :class="{ 'border-red-300': subjectError }"
            />
            <p v-if="subjectError" class="text-xs text-red-500 mt-1">{{ subjectError }}</p>
            <p v-else class="text-xs text-slate-500 mt-2">
              Keep it concise but descriptive ({{ formData.subject.length }}/{{ MAX_SUBJECT_LENGTH }})
            </p>
          </div>

          <!-- Description -->
          <div class="bg-slate-50 border border-slate-200 rounded p-4">
            <label for="description" class="block text-sm font-semibold text-slate-700 mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              v-model="formData.description"
              required
              rows="4"
              :maxlength="MAX_DESCRIPTION_LENGTH"
              placeholder="Please provide detailed information about your feedback..."
              class="w-full px-3 py-2 border border-slate-200 rounded outline-none transition-colors text-sm resize-none bg-white/80"
              :class="{ 'border-red-300': descriptionError }"
            ></textarea>
            <p v-if="descriptionError" class="text-xs text-red-500 mt-1">{{ descriptionError }}</p>
            <p v-else class="text-xs text-slate-500 mt-2">
              Include steps to reproduce (for bugs) or explain your idea in detail ({{ formData.description.length }}/{{ MAX_DESCRIPTION_LENGTH }})
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
                  uiState.isDragOver 
                    ? formData.type === 'bug' 
                      ? 'border-red-500 bg-red-50 shadow-md' 
                      : 'border-blue-500 bg-blue-50 shadow-md'
                    : formData.type === 'bug'
                      ? 'border-slate-200 hover:border-red-300 hover:bg-red-50 hover:shadow-sm'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                ]"
                @click="triggerFileInput"
                @dragover.prevent="uiState.isDragOver = true"
                @dragleave.prevent="uiState.isDragOver = false"
                @drop.prevent="handleFileDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  :accept="ALLOWED_IMAGE_TYPES.join(',')"
                  class="hidden"
                  @change="handleFileSelect"
                />
                <div v-if="!formData.image" class="space-y-2">
                  <Icon name="lucide:upload" class="w-8 h-8 text-slate-400 mx-auto" />
                  <div class="text-sm text-slate-600">
                    <span :class="[
                      'font-medium',
                      formData.type === 'bug' 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    ]">Click to upload</span> or drag and drop
                  </div>
                  <p class="text-xs text-slate-500">PNG, JPG, GIF, WebP up to 5MB</p>
                  <p class="text-xs text-slate-400 mt-1">Screenshots help us understand your feedback better</p>
                </div>
                
                <!-- Image Preview -->
                <div v-else class="space-y-2">
                  <img 
                    :src="formData.imagePreview" 
                    :alt="formData.image.name"
                    class="max-h-32 mx-auto rounded shadow-sm"
                  />
                  <div class="flex items-center justify-center space-x-2 text-sm text-slate-600">
                    <span>{{ formData.image.name }}</span>
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
              v-model="formData.contact"
              type="text"
              :maxlength="MAX_CONTACT_LENGTH"
              placeholder="Email or Discord username for follow-up"
              class="w-full px-3 py-2 border border-slate-200 rounded outline-none transition-colors text-sm bg-white/80"
              :class="{ 'border-red-300': contactError }"
            />
            <p v-if="contactError" class="text-xs text-red-500 mt-1">{{ contactError }}</p>
            <p v-else class="text-xs text-slate-500 mt-2">
              Provide your contact information if you'd like us to follow up ({{ formData.contact.length }}/{{ MAX_CONTACT_LENGTH }})
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
            formData.type === 'bug' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-blue-50 border-blue-200'
          ]">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 mt-0.5">
                <div :class="[
                  'w-5 h-5 rounded-full flex items-center justify-center',
                  formData.type === 'bug' 
                    ? 'bg-red-100' 
                    : 'bg-blue-100'
                ]">
                  <Icon name="lucide:shield-check" :class="[
                    'w-3 h-3',
                    formData.type === 'bug' 
                      ? 'text-red-600' 
                      : 'text-blue-600'
                  ]" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p :class="[
                  'text-xs leading-relaxed',
                  formData.type === 'bug' 
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
      <div v-if="uiState.submissionState === 'form'" :class="[
        'backdrop-blur-sm border-t border-slate-200/80 px-6 py-5 bg-white/80'
      ]">
        <!-- Action Buttons -->
        <div class="flex items-center justify-end pt-1">
          <div class="flex items-center space-x-3">
            <button
              type="button"
              @click="closeModal"
              :disabled="uiState.isSubmitting"
              class="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded transition-all duration-200 border border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              :aria-label="uiState.isSubmitting ? 'Cannot cancel while submitting' : 'Cancel feedback submission'"
            >
              <span>Cancel</span>
            </button>
            <button
              @click="submitFeedback"
              :disabled="!canSubmit || uiState.isSubmitting"
              :class="[
                'group px-6 py-2.5 text-white text-sm font-semibold rounded transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:transform-none',
                formData.type === 'bug'
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-slate-400'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400'
              ]"
              :aria-label="uiState.isSubmitting ? 'Submitting feedback...' : 'Submit your feedback'"
            >
              <Icon 
                v-if="uiState.isSubmitting" 
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
              <span>{{ uiState.isSubmitting ? 'Sending...' : canSubmit ? 'Send Feedback' : 'Complete Form' }}</span>
            </button>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'

// Types
interface Props {
  isOpen: boolean
}

interface TurnstileState {
  token: string
  verified: boolean
  error: string | null
}

interface FormData {
  type: 'bug' | 'suggestion'
  subject: string
  description: string
  contact: string
  image: File | null
  imagePreview: string | null
}

// Constants
const MAX_SUBJECT_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_CONTACT_LENGTH = 100
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Props and emits
const props = defineProps<Props>()
const emit = defineEmits<{
  'close': []
  'submitted': []
}>()

// Refs
const turnstileRef = ref()
const fileInput = ref<HTMLInputElement>()

// Reactive state
const formData = ref<FormData>({
  type: 'suggestion',
  subject: '',
  description: '',
  contact: '',
  image: null,
  imagePreview: null
})

const turnstileState = ref<TurnstileState>({
  token: '',
  verified: false,
  error: null
})

const uiState = ref({
  isSubmitting: false,
  isDragOver: false,
  submissionState: 'form' as 'form' | 'success' | 'error',
  errorMessage: ''
})

// Computed properties
const isVerified = computed(() => turnstileState.value.verified)

const canSubmit = computed(() => {
  const { subject, description } = formData.value
  return Boolean(
    subject.trim() && 
    description.trim() && 
    !uiState.value.isSubmitting &&
    subject.length <= MAX_SUBJECT_LENGTH &&
    description.length <= MAX_DESCRIPTION_LENGTH
  )
})

const subjectError = computed(() => {
  const { subject } = formData.value
  if (!subject.trim()) return ''
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return `Subject must be ${MAX_SUBJECT_LENGTH} characters or less`
  }
  return ''
})

const descriptionError = computed(() => {
  const { description } = formData.value
  if (!description.trim()) return ''
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`
  }
  return ''
})

const contactError = computed(() => {
  const { contact } = formData.value
  if (!contact.trim()) return ''
  if (contact.length > MAX_CONTACT_LENGTH) {
    return `Contact info must be ${MAX_CONTACT_LENGTH} characters or less`
  }
  return ''
})

// Turnstile management
const setVerified = (tokenValue: string): void => {
  turnstileState.value = {
    token: tokenValue,
    verified: true,
    error: null
  }
}

const setError = (error: string): void => {
  turnstileState.value = {
    token: '',
    verified: false,
    error
  }
}

const resetTurnstile = (): void => {
  turnstileState.value = {
    token: '',
    verified: false,
    error: null
  }
}

// Turnstile event handlers
const handleTurnstileVerified = (token: string): void => {
  setVerified(token)
}

const handleTurnstileError = (error: string): void => {
  setError(error)
  setVerified('error-fallback') // Allow submission immediately
}

const handleTurnstileExpired = (): void => {
  setError('Verification expired')
  setVerified('expired-fallback') // Allow submission immediately
}

// Auto-verify Turnstile when modal opens
const autoVerifyTurnstile = (): void => {
  const config = useRuntimeConfig()
  const isTurnstileAvailable = config.public.turnstile && (config.public.turnstile as any).siteKey
  
  if (!isTurnstileAvailable) {
    setVerified('fallback-verified')
    return
  }
  
  // Enable submission immediately as fallback
  setVerified('immediate-fallback')
  
  // Try to execute Turnstile verification
  nextTick(() => {
    setTimeout(() => {
      try {
        if (turnstileRef.value?.turnstile?.execute) {
          turnstileRef.value.turnstile.execute()
        }
      } catch {
        // Silent fail - fallback already set
      }
    }, 1000)
  })
}

// Form management
const resetForm = (): void => {
  formData.value = {
    type: 'suggestion',
    subject: '',
    description: '',
    contact: '',
    image: null,
    imagePreview: null
  }
  
  uiState.value = {
    isSubmitting: false,
    isDragOver: false,
    submissionState: 'form',
    errorMessage: ''
  }
  
  resetTurnstile()
  if (turnstileRef.value?.reset) {
    turnstileRef.value.reset()
  }
}

const closeModal = (): void => {
  if (!uiState.value.isSubmitting) {
    resetForm()
    emit('close')
  }
}

const resetSubmissionState = (): void => {
  uiState.value.submissionState = 'form'
  uiState.value.errorMessage = ''
  resetTurnstile()
  if (turnstileRef.value?.reset) {
    turnstileRef.value.reset()
  }
}

// File handling
const validateFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
  }
  
  if (file.size > MAX_IMAGE_SIZE) {
    return 'File size must be less than 5MB'
  }
  
  return null
}

const processFile = (file: File): void => {
  const error = validateFile(file)
  if (error) {
    alert(error)
    return
  }

  formData.value.image = file
  
  // Create optimized preview
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.imagePreview = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const triggerFileInput = (): void => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleFileDrop = (event: DragEvent): void => {
  uiState.value.isDragOver = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

const removeImage = (): void => {
  formData.value.image = null
  formData.value.imagePreview = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Form submission
const submitFeedback = async (): Promise<void> => {
  if (!canSubmit.value) return

  uiState.value.isSubmitting = true

  try {
    const submitFormData = new FormData()
    submitFormData.append('type', formData.value.type === 'bug' ? 'bug' : 'improvement')
    submitFormData.append('subject', formData.value.subject.trim())
    submitFormData.append('description', formData.value.description.trim())
    
    if (formData.value.contact.trim()) {
      submitFormData.append('contactEmail', formData.value.contact.trim())
    }
    
    if (formData.value.image) {
      submitFormData.append('image', formData.value.image)
    }
    
    // Add real Turnstile token if available
    const config = useRuntimeConfig()
    const isTurnstileAvailable = config.public.turnstile && (config.public.turnstile as any).siteKey
    
    if (isTurnstileAvailable && isVerified.value && turnstileState.value.token) {
      const token = turnstileState.value.token
      const isFallbackToken = token.startsWith('fallback-') || 
                            token.startsWith('delayed-') || 
                            token.startsWith('error-') || 
                            token.startsWith('expired-') || 
                            token.startsWith('immediate-')
      
      if (!isFallbackToken) {
        submitFormData.append('cf-turnstile-response', token)
      }
    }

    const response = await fetch('/api/feedback', {
      method: 'POST',
      body: submitFormData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `HTTP ${response.status}: ${response.statusText}`)
    }

    uiState.value.submissionState = 'success'
    emit('submitted')
    
  } catch (error: any) {
    console.error('Error submitting feedback:', error)
    uiState.value.errorMessage = error.message || 'Failed to submit feedback. Please try again.'
    uiState.value.submissionState = 'error'
  } finally {
    uiState.value.isSubmitting = false
  }
}

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetForm()
  } else {
    nextTick(() => {
      autoVerifyTurnstile()
    })
  }
})
</script>
  