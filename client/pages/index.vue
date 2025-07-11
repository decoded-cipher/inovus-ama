<template>
  <div :style="{ height: 'calc(var(--vh, 1vh) * 100)' }" class="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col overflow-hidden">
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
        :is-offline="!healthStatus.isOnline"
        @question-click="handleQuestionClick"
        @clear-conversation="clearConversation"
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
          :is-offline="!healthStatus.isOnline"
          @update:input="input = $event"
          @submit="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>



<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { canAskToday } from '~/composables/useRateLimit'
import { useHealthCheck } from '~/composables/useHealthCheck'

const { status: healthStatus } = useHealthCheck()

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
    content: "Hello! I'm InoBot, your intelligent assistant for everything Inovus Labs. I can help you learn about our programs, research initiatives, certification processes, and community opportunities. Feel free to ask follow-up questions to dive deeper into any topic. What would you like to explore today?",
    role: 'assistant',
    timestamp: new Date(),
  },
])

const input = ref('')
const isLoading = ref(false)
const showSidebar = ref(false)
const dynamicSuggestions = ref<string[]>([])

const suggestedQuestions = computed(() => {
  const base = [
    "What is Inovus Labs' mission?",
    "How can I get certified?",
    "What research projects are active?",
    "How do I join the community?",
  ]
  
  // If we have dynamic suggestions from the last response, show those instead
  if (dynamicSuggestions.value.length > 0) {
    return [...dynamicSuggestions.value, ...base.slice(0, 4 - dynamicSuggestions.value.length)]
  }
  
  return base
})

// Methods
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const closeSidebar = () => {
  showSidebar.value = false
}

const handleQuestionClick = (question: string) => {
  // Don't allow question selection when offline
  if (!healthStatus.value.isOnline) {
    return
  }
  
  input.value = question
  closeSidebar()
}

const handleSubmit = async (turnstileToken?: string) => {
  // Don't allow submission when offline
  if (!healthStatus.value.isOnline) {
    messages.value.push({
      id: Date.now().toString(),
      role: 'assistant',
      content: "I'm currently offline. Please wait for the connection to be restored.",
      timestamp: new Date(),
    });
    return;
  }
  
  // if (!canAskToday()) {
  //   messages.value.push({
  //     id: Date.now().toString(),
  //     role: 'assistant',
  //     content: "You've reached your daily question limit. Try again tomorrow!",
  //     timestamp: new Date(),
  //   });
  //   return;
  // }

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
    // Prepare conversation history (exclude the initial greeting and current question)
    const conversationHistory = messages.value
      .slice(1, -1) // Skip initial greeting and current question
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))

    const requestBody: any = { 
      question,
      conversationHistory 
    }

    // Add Turnstile token if provided
    if (turnstileToken) {
      requestBody.turnstileToken = turnstileToken
    }

    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error)
    }

    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      content: data.answer ?? "Sorry, I can only answer questions about Inovus Labs.",
      role: 'assistant' as const,
      timestamp: new Date(),
    }

    messages.value.push(assistantMessage);

    // Update dynamic suggestions if provided
    if (data.followUpSuggestions && Array.isArray(data.followUpSuggestions)) {
      dynamicSuggestions.value = data.followUpSuggestions
    } else {
      dynamicSuggestions.value = []
    }

  } catch (err) {
    console.error('Chat error:', err)
    
    let errorMessage = "Something went wrong. Please try again later."
    
    if (err instanceof Error) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMessage = "Unable to connect to the server. Please check your internet connection and try again."
      } else if (err.message.includes('HTTP error! status: 429')) {
        errorMessage = "Too many requests. Please wait a moment before trying again."
      } else if (err.message.includes('HTTP error! status: 400')) {
        errorMessage = "Invalid question format. Please try rephrasing your question."
      } else if (err.message.includes('HTTP error! status: 403')) {
        errorMessage = "Security verification failed. Please complete the verification and try again."
      }
    }

    messages.value.push({
      id: (Date.now() + 1).toString(),
      content: errorMessage,
      role: 'assistant',
      timestamp: new Date(),
    });
  } finally {
    isLoading.value = false
  }
}

const clearConversation = () => {
  messages.value = [
    {
      id: '1',
      content: "Hello! I'm InoBot, your intelligent assistant for everything Inovus Labs. I can help you learn about our programs, research initiatives, certification processes, and community opportunities. Feel free to ask follow-up questions to dive deeper into any topic. What would you like to explore today?",
      role: 'assistant',
      timestamp: new Date(),
    },
  ]
  dynamicSuggestions.value = []
  closeSidebar()
}

// Fix for mobile 100vh issue
const setVh = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}
onMounted(() => {
  setVh()
  window.addEventListener('resize', setVh)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', setVh)
})

// SEO
// SEO Meta
useHead({
  title: 'InoBot - AI Assistant for Inovus Labs | Ask Anything About Our Programs',
  meta: [
    {
      name: 'description',
      content: 'InoBot is your intelligent AI assistant for Inovus Labs. Get instant answers about our research programs, certifications, community opportunities, and innovation initiatives. Powered by advanced AI technology including AutoRAG, Cloudflare R2, and Vectorize database.'
    },
    {
      name: 'keywords',
      content: 'InoBot, Inovus Labs, AI Assistant, Research Programs, Certifications, Innovation, Technology, Machine Learning, AutoRAG, Vectorize, Cloudflare, AI Chatbot'
    },
    // Open Graph
    { property: 'og:title', content: 'InoBot - AI Assistant for Inovus Labs' },
    { property: 'og:description', content: 'Get instant, intelligent answers about Inovus Labs programs, research, certifications, and community opportunities from InoBot.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://ama.inovuslabs.org' },
    // Twitter
    { name: 'twitter:title', content: 'InoBot - AI Assistant for Inovus Labs' },
    { name: 'twitter:description', content: 'Get instant, intelligent answers about Inovus Labs programs, research, and opportunities.' }
  ],
  link: [
    { rel: 'canonical', href: 'https://ama.inovuslabs.org' }
  ]
})
</script>
