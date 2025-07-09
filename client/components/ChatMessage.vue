<template>
  <div
    :class="[
      'flex items-start space-x-2 sm:space-x-3',
      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
    ]"
  >
    <div
      :class="[
        'w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-semibold',
        message.role === 'user'
          ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/60'
          : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg'
      ]"
    >
      {{ message.role === 'user' ? 'You' : 'IB' }}
    </div>

    <div :class="['max-w-[85%] sm:max-w-[75%]', message.role === 'user' ? 'text-right' : '']">
      <div
        :class="[
          'inline-block p-2.5 sm:p-3 rounded-lg sm:rounded-xl',
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
      <p class="text-xs text-slate-500 mt-1 px-1">
        {{ formatTime(message.timestamp) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Props {
  message: Message
}

defineProps<Props>()

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
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