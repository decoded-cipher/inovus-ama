<template>
  <!-- Modal Overlay -->
  <div 
    v-if="show" 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click="handleOverlayClick"
  >
    <!-- Modal Content -->
    <div 
      class="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-2 py-2 transform transition-all duration-300"
      :class="show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
      @click.stop
    >
      <!-- Header -->
      <div class="p-6 text-center">
        <div class="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="lucide:alert-triangle" class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-xl font-bold text-slate-900 mb-2">Important Notice</h2>
      </div>

      <!-- Content -->
      <div class="px-6 pb-6">
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p class="text-sm text-slate-700 leading-relaxed mb-3">
            InoBot uses AI to provide information about Inovus Labs. The responses may contain inaccuracies due to AI limitations, outdated data, or technical issues.
          </p>
          <p class="text-sm text-slate-700 leading-relaxed">
            <strong>Do not use this information for important decisions, academic work, or professional purposes.</strong> Always verify information through official Inovus Labs sources.
          </p>
        </div>

        <!-- Data Collection Notice -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div class="flex items-start space-x-2">
            <Icon name="lucide:database" class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p class="text-sm text-blue-800 leading-relaxed">
              <strong>Data Collection:</strong> We store your questions and interactions during this session to analyze usage patterns and improve our AI system. No personal information is collected.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex space-x-3">
          <button
            @click="handleDecline"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleAccept"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded transition-all shadow-lg shadow-blue-500/25"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'accept': []
  'decline': []
}>()

const handleAccept = () => {
  emit('accept')
}

const handleDecline = () => {
  emit('decline')
}

const handleOverlayClick = () => {
  // Don't allow closing by clicking overlay - force user to make a choice
}
</script>
