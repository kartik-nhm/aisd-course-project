"""
Module 4: Multilingual Medical AI Chatbot
File: rag_engine.py

Vector knowledge base retrieval using Pinecone & HuggingFace Embeddings.
"""

import os
from typing import List

class MedicalRAGEngine:
    def __init__(self, index_name: str = None, embedding_model: str = "intfloat/e5-base-v2"):
        self.index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "medical-knowledge-base")
        self.embedding_model = embedding_model
        self.retriever = None
        self._init_retriever()

    def _init_retriever(self):
        pinecone_key = os.getenv("PINECONE_API_KEY")
        if not pinecone_key:
            print("[RAG Engine] Warning: PINECONE_API_KEY not configured. Running in direct knowledge mode.")
            return

        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            from langchain_pinecone import PineconeVectorStore

            embeddings = HuggingFaceEmbeddings(model_name=self.embedding_model)
            vector_store = PineconeVectorStore.from_existing_index(
                index_name=self.index_name,
                embedding=embeddings
            )
            self.retriever = vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 3}
            )
            print(f"[RAG Engine] Successfully connected to Pinecone index: {self.index_name}")
        except Exception as e:
            print(f"[RAG Engine] Error initializing Pinecone store: {e}")

    def retrieve_context(self, english_query: str) -> List[str]:
        if not self.retriever:
            return [
                "Standard clinical reference: Provide supportive hydration, rest, and antipyretics for fever. Consult a physician if symptoms worsen."
            ]

        try:
            docs = self.retriever.invoke(english_query)
            return [doc.page_content for doc in docs]
        except Exception as e:
            print(f"[RAG Engine] Retrieval query failed: {e}")
            return []
