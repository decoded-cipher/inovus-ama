<template>
  <div
    :class="[
      'w-80 sm:w-96 lg:w-80 xl:w-96 flex-shrink-0 glass-effect lg:border-r-0',
      'transition-transform duration-300 ease-in-out',
      'flex flex-col justify-center p-4 sm:p-6',
      show ? 'translate-x-0' : '-translate-x-full',
      'lg:translate-x-0 lg:relative fixed left-0 top-0 bottom-0 z-50'
    ]"
  >
    <!-- Hero Content -->
    <div class="lg:block">
      <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-3 tracking-tight leading-tight">
        Ask me anything about
        <br />
        <span class="gradient-text">Inovus Labs</span>
      </h1>
      <p class="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed">
        Get instant, intelligent answers about our events, initiatives, certifications, and community from InoBot.
      </p>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div class="stat-card-blue">
          <div class="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            98.5%
          </div>
          <div class="text-xs text-slate-600">Accuracy</div>
        </div>
        <div class="stat-card-green">
          <div class="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            1.2s
          </div>
          <div class="text-xs text-slate-600">Response</div>
        </div>
        <div class="stat-card-purple">
          <div class="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            12.4k+
          </div>
          <div class="text-xs text-slate-600">Questions</div>
        </div>
      </div>

      <!-- Suggested Questions -->
      <div>
        <h3 class="text-sm font-semibold text-slate-900 mb-3">Popular Questions</h3>
        
        <!-- Offline Notice -->
        <div v-if="isOffline" class="mb-3 p-3 bg-red-50 border border-red-200 rounded">
          <div class="flex items-center space-x-2">
            <Icon name="lucide:wifi-off" class="w-4 h-4 text-red-600" />
            <span class="text-xs text-red-700">
              Service offline - Questions disabled
            </span>
          </div>
        </div>
        
        <div class="space-y-2">
          <button
            v-for="(question, index) in suggestedQuestions"
            :key="index"
            :disabled="isLoading || isOffline"
            :class="[
              'w-full text-left p-3 text-xs sm:text-sm text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded transition-all duration-200 border border-transparent hover:border-blue-100/60',
              (isLoading || isOffline) && 'opacity-50 cursor-not-allowed'
            ]"
            @click="$emit('question-click', question)"
          >
            {{ question }}
          </button>
        </div>
      </div>

      <!-- Clear Conversation Button -->
      <div class="mt-6 pt-4 border-t border-slate-200/60">
        <button
          :disabled="isLoading || isOffline"
          :class="[
            'w-full p-3 text-xs sm:text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded sm:rounded-xl transition-all duration-200 border border-slate-200/60 hover:border-slate-300/60 flex items-center justify-center gap-2',
            (isLoading || isOffline) && 'opacity-50 cursor-not-allowed'
          ]"
          @click="$emit('clear-conversation')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Clear Conversation
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  suggestedQuestions: string[]
  isLoading: boolean
  isOffline?: boolean
}

defineProps<Props>()

defineEmits<{
  'question-click': [question: string]
  'clear-conversation': []
}>()
</script>
