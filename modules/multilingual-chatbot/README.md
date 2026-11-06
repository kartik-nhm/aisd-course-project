# Module 4: Multilingual Medical AI Chatbot
> Feature 4 from [TECHNOLOGY_SURVEY.md](../../TECHNOLOGY_SURVEY.md)

## Purpose & Architecture
High-performance RAG chatbot microservice providing instant multilingual medical answers:
1. **Multilingual Translation Layer:** **Groq LLaMA 3.1** (`llama-3.1-8b-instant`) auto-detects language and script (English, Romanized Hindi/Urdu, Romanized Kannada) and translates queries into clinical English for retrieval.
2. **Vector Knowledge Base:** **Pinecone** vector database with medical literature indexed using **HuggingFace Embeddings** (`intfloat/e5-base-v2`).
3. **Contextual Response Generation:** **Google Gemini** / **Groq LLaMA 3.3 70B** generates empathetic responses in vernacular scripts with mandatory clinical disclaimers.
4. **Regional Query Tagging:** Tags incoming queries with clinical entities and the user's postal pincode to feed the Regional Pharmacy Surge Detection Engine.
