
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@nuxtjs/sitemap",
    "@nuxtjs/robots",
    "nuxt-icon",
    "@nuxtjs/turnstile",
  ],
  css: ["~/assets/css/main.css"],

  // Site configuration - used by all SEO modules
  site: {
    url: "https://ama.inovuslabs.org",
    name: "InoBot - Inovus Labs AI Assistant",
    description: "Get instant, intelligent answers about Inovus Labs programs, research, certifications, and community opportunities from InoBot.",
    defaultLocale: "en",
  },

  // SEO Configuration
  app: {
    head: {
      htmlAttrs: {
        lang: "en-US",
      },
      title: "InoBot - AI Assistant for Inovus Labs | Ask Anything About Our Programs",
      titleTemplate: "%s | InoBot - Inovus Labs AI Assistant",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "InoBot is your intelligent AI assistant for Inovus Labs. Get instant answers about our research programs, certifications, community opportunities, and innovation initiatives. Powered by advanced AI technology.",
        },
        {
          name: "keywords",
          content: "InoBot, Inovus Labs, AI Assistant, Research Programs, Certifications, Innovation, Technology, Machine Learning, AutoRAG, Vectorize, Cloudflare",
        },
        { name: "author", content: "Inovus Labs" },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { name: "googlebot", content: "index, follow" },
        { name: "bingbot", content: "index, follow" },

        // Open Graph
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "InoBot - Inovus Labs" },
        { property: "og:title", content: "InoBot - AI Assistant for Inovus Labs | Ask Anything About Our Programs" },
        {
          property: "og:description",
          content: "Get instant, intelligent answers about Inovus Labs programs, research, certifications, and community opportunities from InoBot.",
        },
        { property: "og:url", content: "https://ama.inovuslabs.org" },
        { property: "og:image", content: "https://ama.inovuslabs.org/og-image.jpg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "InoBot - AI Assistant for Inovus Labs" },
        { property: "og:locale", content: "en_US" },

        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@InovusLabs" },
        { name: "twitter:creator", content: "@InovusLabs" },
        { name: "twitter:title", content: "InoBot - AI Assistant for Inovus Labs" },
        {
          name: "twitter:description",
          content: "Get instant, intelligent answers about Inovus Labs programs, research, and opportunities.",
        },
        { name: "twitter:image", content: "https://ama.inovuslabs.org/og-image.jpg" },
        { name: "twitter:image:alt", content: "InoBot AI Assistant Interface" },

        // Additional SEO
        { name: "theme-color", content: "#3B82F6" },
        { name: "msapplication-TileColor", content: "#3B82F6" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: "InoBot" },

        // Performance hints
        { "http-equiv": "x-dns-prefetch-control", content: "on" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "canonical", href: "https://ama.inovuslabs.org" },

        // Preconnect to external domains
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "dns-prefetch", href: "//www.google-analytics.com" },
        { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
        { rel: "dns-prefetch", href: "//fonts.gstatic.com" },
      ],
      script: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "InoBot",
            description:
              "AI Assistant for Inovus Labs - Get instant answers about research programs, certifications, and innovation opportunities",
            url: "https://ama.inovuslabs.org",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web Browser",
            creator: {
              "@type": "Organization",
              name: "Inovus Labs",
              url: "https://inovuslabs.org",
              logo: "https://inovuslabs.org/assets/logo.svg",
            },
            featureList: [
              "AI-powered question answering",
              "Research program information",
              "Certification guidance",
              "Community opportunities",
              "Real-time responses",
            ],
          }),
        },
      ],
    },
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: false,
    inlineSSRStyles: false,
  },

  compatibilityDate: "2025-06-22",

  // Nitro configuration for better performance
  nitro: {
    compressPublicAssets: true,
    minify: true,
    prerender: {
      crawlLinks: true,
      routes: ["/"],
    },
  },

  sitemap: {
    enabled: true,
    modules: ["@nuxtjs/sitemap"],
    hostname: "https://ama.inovuslabs.org",
    gzip: true,
    routes: [
      {
        url: '/',
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      }
      // Add more routes as needed
    ]
  },

  robots: {
    credits: false,
  },

  // Runtime config
  runtimeConfig: {
    turnstileSecretKey: process.env.NUXT_TURNSTILE_SECRET_KEY,
    public: {
      serverUrl: process.env.NUXT_PUBLIC_SERVER_URL,
      turnstile: {
        siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
      },
    }
  },

  // Turnstile configuration
  turnstile: {
    siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
  },
})
