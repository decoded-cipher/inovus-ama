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
        Get instant, intelligent answers about our programs, research, certifications, and community from InoBot.
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
        <div class="space-y-2">
          <button
            v-for="(question, index) in suggestedQuestions"
            :key="index"
            :disabled="isLoading"
            class="w-full text-left p-3 text-xs sm:text-sm text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-100/60"
            @click="$emit('question-click', question)"
          >
            {{ question }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  suggestedQuestions: string[]
  isLoading: boolean
}

defineProps<Props>()

defineEmits<{
  'question-click': [question: string]
}>()
</script>
