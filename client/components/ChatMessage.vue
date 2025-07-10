<template>
  <div
    :class="[
      'flex items-start space-x-2 sm:space-x-3',
      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
    ]"
  >
    <!-- <div
      :class="[
        'w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-semibold',
        message.role === 'user'
          ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/60'
          : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg'
      ]"
    >
      <Icon 
        :name="message.role === 'user' ? 'heroicons:user-20-solid' : 'heroicons:cpu-chip-20-solid'" 
        class="w-3 h-3 sm:w-4 sm:h-4"
      />
    </div> -->

    <div :class="['max-w-[85%] sm:max-w-[75%]', message.role === 'user' ? 'text-right' : '']">
      <div
        :class="[
          'inline-block p-2.5 sm:p-3 rounded sm:rounded-xl',
          message.role === 'user'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
            : 'bg-white border border-slate-200/60 text-slate-900 shadow-sm'
        ]"
      >
        <div 
          class="text-xs sm:text-sm leading-relaxed message-content" 
          v-html="message.content"
        ></div>
        <!-- <p class="text-xs sm:text-sm leading-relaxed">{{ message.content }}</p> -->
      </div>
      
      <!-- Feedback and timestamp for assistant messages -->
      <div v-if="message.role === 'assistant'" class="flex items-center justify-between mt-1 px-1">
        <p class="text-xs text-slate-500">
          {{ formatTime(message.timestamp) }}
        </p>
        <div class="flex items-center space-x-1">

          
          <button
            :class="[
              'p-1 transition-all duration-200 hover:scale-110',
              feedback[message.id] === 'like' 
                ? 'text-green-600 hover:text-green-700' 
                : 'text-slate-400 hover:text-green-600'
            ]"
            @click="handleFeedback('like')"
            title="Helpful response"
          >
            <svg 
              class="w-4 h-4"
              viewBox="0 0 24 24"
              :fill="feedback[message.id] === 'like' ? 'currentColor' : 'none'"
              :stroke="feedback[message.id] === 'like' ? 'none' : 'currentColor'"
              stroke-width="2"
            >
              <path 
                d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"
                :stroke="feedback[message.id] === 'like' ? 'none' : 'currentColor'"
                :fill="feedback[message.id] === 'like' ? 'currentColor' : 'none'"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

          </button>

          <button
            :class="[
              'p-1 transition-all duration-200 hover:scale-110',
              feedback[message.id] === 'dislike' 
                ? 'text-red-600 hover:text-red-700' 
                : 'text-slate-400 hover:text-red-600'
            ]"
            @click="handleFeedback('dislike')"
            title="Not helpful"
          >
            <svg 
              class="w-4 h-4"
              viewBox="0 0 24 24"
              :fill="feedback[message.id] === 'dislike' ? 'currentColor' : 'none'"
              :stroke="feedback[message.id] === 'dislike' ? 'none' : 'currentColor'"
              stroke-width="2"
            >
              <path 
                d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 6.748 15H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521C4.537 3.997 5.136 3.75 5.754 3.75H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 14.023c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.958 8.958 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z"
                :stroke="feedback[message.id] === 'dislike' ? 'none' : 'currentColor'"
                :fill="feedback[message.id] === 'dislike' ? 'currentColor' : 'none'"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>


        </div>
      </div>
      
      <!-- User message timestamp -->
      <p v-if="message.role === 'user'" class="text-xs text-slate-500 mt-1 px-1">
        {{ formatTime(message.timestamp) }}
      </p>

      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Props {
  message: Message
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'feedback': [messageId: string, type: 'like' | 'dislike']
}>()

// Store feedback state locally
const feedback = reactive<Record<string, 'like' | 'dislike'>>({})

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleFeedback = (type: 'like' | 'dislike') => {
  // Toggle feedback if same type clicked, otherwise set new type
  if (feedback[props.message.id] === type) {
    delete feedback[props.message.id]
  } else {
    feedback[props.message.id] = type
  }
  
  emit('feedback', props.message.id, type)
}
</script>

<style scoped>
.message-content {
  @apply text-inherit;
}

:deep(.message-content h1),
:deep(.message-content h2),
:deep(.message-content h3),
:deep(.message-content h4),
:deep(.message-content h5),
:deep(.message-content h6) {
  @apply font-semibold mb-2 text-inherit;
}

:deep(.message-content h1) { @apply text-base sm:text-lg; }
:deep(.message-content h2) { @apply text-sm sm:text-base; }
:deep(.message-content h3) { @apply text-xs sm:text-sm; }

:deep(.message-content p) {
  @apply mb-2 last:mb-0;
}

:deep(.message-content ul),
:deep(.message-content ol) {
  @apply mb-2 pl-4 space-y-1;
}

:deep(.message-content ul) {
  @apply list-disc;
}

:deep(.message-content ol) {
  @apply list-decimal;
}

:deep(.message-content li) {
  @apply text-inherit;
}

:deep(.message-content strong),
:deep(.message-content b) {
  @apply font-semibold text-inherit;
}

:deep(.message-content em),
:deep(.message-content i) {
  @apply italic text-inherit;
}

:deep(.message-content a) {
  @apply underline text-inherit hover:opacity-80 transition-opacity text-blue-600;
}

:deep(.message-content code) {
  @apply bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono;
}

:deep(.message-content pre) {
  @apply bg-gray-100 text-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2;
}

:deep(.message-content pre code) {
  @apply bg-transparent p-0;
}

:deep(.message-content blockquote) {
  @apply border-l-2 border-gray-300 pl-2 italic mb-2;
}

/* Adjust styles for user messages (white text on blue background) */
:deep(.bg-gradient-to-r .message-content code) {
  @apply bg-white/20 text-white;
}

:deep(.bg-gradient-to-r .message-content pre) {
  @apply bg-white/20 text-white;
}

:deep(.bg-gradient-to-r .message-content blockquote) {
  @apply border-white/40;
}
</style>
