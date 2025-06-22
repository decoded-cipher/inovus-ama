<template>
  <header class="glass-effect px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 shadow-sm">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Icon name="lucide:sparkles" class="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
        <div>
          <h1 class="text-base sm:text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            InoBot
          </h1>
          <p class="text-xs text-slate-500 -mt-0.5 hidden sm:block">by Inovus Labs</p>
        </div>
      </div>

      <div class="flex items-center space-x-3 sm:space-x-6">
        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center space-x-6">
          <NuxtLink to="#" class="text-sm text-slate-600 hover:text-slate-900 transition-colors">
            Blog
          </NuxtLink>
          <NuxtLink to="#" class="text-sm text-slate-600 hover:text-slate-900 transition-colors">
            Podcast
          </NuxtLink>
          <NuxtLink to="#" class="text-sm text-slate-600 hover:text-slate-900 transition-colors">
            Projects
          </NuxtLink>
          <button class="text-sm border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all px-3 py-1.5 rounded-md flex items-center space-x-1">
            <span>Inovus Labs</span>
            <Icon name="lucide:arrow-up-right" class="w-3 h-3" />
          </button>
        </nav>

        <!-- Status and Mobile Menu -->
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 rounded-full px-2 sm:px-3 py-1">
            <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span class="text-xs text-emerald-700 font-medium">Online</span>
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="lg:hidden hover:bg-blue-50 p-2 rounded-md transition-colors"
            @click="$emit('toggle-sidebar')"
          >
            <Icon name="lucide:menu" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  'toggle-sidebar': []
}>()
</script>
