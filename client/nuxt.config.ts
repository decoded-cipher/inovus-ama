
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/color-mode", "@vueuse/nuxt", "nuxt-icon"],
  css: ["~/assets/css/main.css"],
  colorMode: {
    classSuffix: "",
  },
  app: {
    head: {
      title: "InoBot - Inovus Labs AI Assistant",
      meta: [
        {
          name: "description",
          content: "Ask InoBot anything about Inovus Labs - programs, research, certifications, and community.",
        },
        { name: "keywords", content: "InoBot, Inovus Labs, AI Assistant, Questions, Programs, Research" },
      ],
    },
  },
  compatibilityDate: "2025-06-22",
  runtimeConfig: {
    public: {
      autoragInstanceId: process.env.NUXT_AUTORAG_INSTANCE_ID,
      autoragApiToken: process.env.NUXT_AUTORAG_API_TOKEN,
    }
  },
})
