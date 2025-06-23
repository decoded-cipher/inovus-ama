<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h1 class="text-4xl font-bold font-heading text-slate-900 mb-2">
          {{ error.statusCode }}
        </h1>
        <p class="text-lg text-slate-600 font-medium">
          {{ getErrorMessage() }}
        </p>
      </div>
      
      <div class="space-y-4">
        <button
          @click="handleError"
          class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25"
        >
          {{ error.statusCode === 404 ? 'Go Home' : 'Try Again' }}
        </button>
        
        <NuxtLink 
          to="/"
          class="block text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          Return to InoBot
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { clearError, navigateTo } from '#app';

interface NuxtError {
  statusCode: number
  statusMessage: string
}

const props = defineProps<{
  error: NuxtError
}>()

const getErrorMessage = () => {
  switch (props.error.statusCode) {
    case 404:
      return "The page you're looking for doesn't exist."
    case 500:
      return "Something went wrong on our end."
    default:
      return props.error.statusMessage || "An unexpected error occurred."
  }
}

const handleError = () => {
  if (props.error.statusCode === 404) {
    navigateTo('/')
  } else {
    clearError({ redirect: '/' })
  }
}
</script>
