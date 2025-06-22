<template>
  <div class="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col overflow-hidden">
    <!-- Header -->
    <AppHeader 
      :show-sidebar="showSidebar"
      @toggle-sidebar="toggleSidebar"
    />

    <!-- Main Content -->
    <div class="flex-1 flex max-w-7xl mx-auto w-full min-h-0 relative">
      <!-- Mobile Sidebar Overlay -->
      <div 
        v-if="showSidebar" 
        class="fixed inset-0 bg-black/20 z-40 lg:hidden" 
        @click="closeSidebar"
      ></div>

      <!-- Left Sidebar -->
      <AppSidebar 
        :show="showSidebar"
        :suggested-questions="suggestedQuestions"
        :is-loading="isLoading"
        @question-click="handleQuestionClick"
      />

      <!-- Right Side - Chat -->
      <div class="flex-1 flex flex-col min-h-0 p-4 sm:p-6">
        <!-- Mobile Hero -->
        <div class="lg:hidden mb-4">
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Ask 
            <span class="gradient-text">InoBot</span>
          </h2>
          <p class="text-sm text-slate-600">Your intelligent assistant for Inovus Labs</p>
        </div>

        <!-- Chat Container -->
        <ChatContainer 
          :messages="messages"
          :is-loading="isLoading"
          :input="input"
          @update:input="input = $event"
          @submit="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

// Reactive state
const messages = ref<Message[]>([
  {
    id: '1',
    content: "Hello! I'm InoBot, your intelligent assistant for everything Inovus Labs. I can help you learn about our programs, research initiatives, certification processes, and community opportunities. What would you like to explore today?",
    role: 'assistant',
    timestamp: new Date(),
  },
])

const input = ref('')
const isLoading = ref(false)
const showSidebar = ref(false)

const suggestedQuestions = [
  "What is Inovus Labs' mission?",
  "How can I get certified?",
  "What research projects are active?",
  "How do I join the community?",
]

// Methods
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const closeSidebar = () => {
  showSidebar.value = false
}

const handleQuestionClick = (question: string) => {
  input.value = question
  closeSidebar()
}

const handleSubmit = async () => {
  if (!input.value.trim() || isLoading.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    content: input.value.trim(),
    role: 'user',
    timestamp: new Date(),
  }

  messages.value.push(userMessage)
  const currentInput = input.value.trim()
  input.value = ''
  isLoading.value = true
  closeSidebar()

  // Simulate AI response
  setTimeout(() => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: `Thank you for your question about "${currentInput}". I'd be happy to provide detailed information about Inovus Labs. In a production environment, I would access our comprehensive knowledge base to give you accurate, up-to-date information about our programs, research, and opportunities.`,
      role: 'assistant',
      timestamp: new Date(),
    }
    messages.value.push(assistantMessage)
    isLoading.value = false
  }, 1500)
}

// SEO
useHead({
  title: 'InoBot - Inovus Labs AI Assistant',
  meta: [
    { name: 'description', content: 'Ask InoBot anything about Inovus Labs - programs, research, certifications, and community.' }
  ]
})
</script>
