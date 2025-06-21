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
        <p class="text-xs sm:text-sm leading-relaxed">{{ message.content }}</p>
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
