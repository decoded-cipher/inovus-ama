// https://nuxt.com/docs/api/configuration/nuxt-config
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
})
