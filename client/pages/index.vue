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

const config = useRuntimeConfig()

const handleSubmit = async () => {
  if (!canAskToday()) {
    messages.value.push({
      id: Date.now().toString(),
      role: 'assistant',
      content: "You've reached your daily question limit. Try again tomorrow!",
      timestamp: new Date(),
    });
    return;
  }

  if (!input.value.trim() || isLoading.value) return;

  const question = input.value.trim()

  messages.value.push({
    id: Date.now().toString(),
    content: question,
    role: 'user',
    timestamp: new Date(),
  });

  input.value = ''
  isLoading.value = true
  closeSidebar()

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/autorag/${config.public.autoragInstanceId}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.public.autoragApiToken}`,
      },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();

    messages.value.push({
      id: (Date.now() + 1).toString(),
      content: data.answer ?? "Sorry, I can only answer questions about Inovus Labs.",
      role: 'assistant',
      timestamp: new Date(),
    });

  } catch (err) {
    messages.value.push({
      id: (Date.now() + 1).toString(),
      content: "Something went wrong. Please try again later.",
      role: 'assistant',
      timestamp: new Date(),
    });
  } finally {
    isLoading.value = false
  }
}


// SEO
useHead({
  title: 'InoBot - Inovus Labs AI Assistant',
  meta: [
    { name: 'description', content: 'Ask InoBot anything about Inovus Labs - programs, research, certifications, and community.' }
  ]
})
</script>
