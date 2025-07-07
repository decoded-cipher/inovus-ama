# 🧠 Inovus Labs AMA (Ask Me Anything)

### ⚠️ ⚠️ **WARNING: UNDER ACTIVE DEVELOPMENT !** ⚠️ ⚠️


🚧 **This project is work in progress.** Parts — or even the entire platform — **may not function correctly** at this stage. Expect bugs, unfinished features, and potential breaking changes. 🛠️🚀


---


An AI-powered, self-hosted Ask-Me-Anything system for Inovus Labs. Ask questions about Inovus Labs and get accurate, grounded answers based on official Inovus documents and knowledge.

This project implements a custom **Retrieval Augmented Generation (RAG)** pipeline using:

✅  **Gemini API** for both embeddings and answer generation  
✅  **Pinecone** for efficient, scalable vector search
✅  **Cloudflare R2** for secure document storage  
✅  A modern **Nuxt 3** frontend for seamless user interaction  
✅  Node.js + Hono API backend for orchestrating the RAG flow  
❎  **Planned MCP Server** integration for real-time, live knowledge  

All answers are generated based on your private document collection, with strict topic control. No unrelated or hallucinated information is allowed.


## 🎨 Live Demo

Check out the live demo at [Inovus Labs AMA](https://ama.inovuslabs.com) (currently in development, may be unstable).


## 🗂️ Tech Stack

| Layer           | Technology                             |
|-----------------|----------------------------------------|
| Frontend        | Nuxt 3 (Vue 3) + Tailwind CSS          |
| RAG Backend     | Node.js + Hono                         |
| Vector Storage  | Pinecone                               |
| Document Storage| Cloudflare R2                          |
| Embeddings      | Gemini API (embedding-001)             |
| Completion      | Gemini API (models/gemini-2.5-flash)   |
| Deployment      | Cloudflare Workers / Pages             |
| **Planned**     | MCP Server for live data               |


## 💡 Features

✅ Conversation History & Context Awareness  
✅ Intelligent Follow-up Question Detection  
✅ Smart Conversation Summarization (token optimization)  
✅ Dynamic Follow-up Suggestions  
✅ Clear Conversation functionality


## 🛠️ How It Works

1. User asks a question via the Nuxt frontend
2. API server generates a question embedding (Gemini)
3. Pinecone returns relevant knowledge chunks
4. System composes a grounded prompt
5. Gemini API generates a final answer
6. Response with source references is displayed in the chat UI

In the future, the system will also pull real-time knowledge from the **Inovus MCP Server**.


## 🏷️ License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


## 📦 Roadmap

* [ ] Streaming answers to frontend
* [ ] Advanced rate limiting with Cloudflare Workers
* [ ] **MCP Server integration for real-time knowledge**
* [x] Source citations and traceability
