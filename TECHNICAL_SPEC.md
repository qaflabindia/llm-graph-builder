# Technical Specification: Neo4j LLM Graph Builder

## 1. Executive Summary
The **LLM Graph Builder** is an advanced application designed to transform unstructured data (PDFs, YouTube videos, Web pages, etc.) into structured **Knowledge Graphs** stored in Neo4j. By leveraging Large Language Models (LLMs) and the LangChain framework, it automates the extraction of nodes and relationships, enabling complex semantic retrieval and Retrieval-Augmented Generation (RAG) chat capabilities.

## 2. System Architecture
The application follows a decoupled microservices architecture, containerized via Docker.

### 2.1 Component Diagram
- **Frontend**: React (TypeScript) application built with Vite and Neo4j Design Library (NDL). Handles file uploads, visualization (Bloom), and chat interfaces.
- **Backend**: FastAPI (Python) service. Orchestrates the ingestion pipeline, interacts with LLMs, and manages Neo4j transactions.
- **Database**: Neo4j Graph Database (Aura or Enterprise). Stores the extracted Knowledge Graph and vector embeddings.
- **LLM/AI Services**: Integrates with OpenAI, Google Vertex AI, Diffbot, Anthropic, Bedrock, and local models (Ollama).

## 3. Core Workflows

### 3.1 Data Ingestion & Chunking
1.  **Upload**: User uploads files or provides URLs (S3, GCS, YouTube, Wiki).
2.  **Processing**: files are processed into text chunks.
    - *Configurable parameters*: Chunk size, overlap, and token limits.
3.  **Storage**: Chunks are stored as `Chunk` nodes in Neo4j, linked sequentially (`NEXT_CHUNK`) and to their source `Document`.

### 3.2 Graph Extraction Pipeline
The core logic resides in `backend/src/llm.py` and `backend/score.py`.
1.  **Model Selection**: User selects an LLM (e.g., `gpt-4o`, `diffbot`).
2.  **Extraction**:
    - **Diffbot**: Uses the Diffbot NLP API to extract entities and facts directly.
    - **LLM (OpenAI/Generic)**: Uses `LLMGraphTransformer` (LangChain) with prompt engineering to extract nodes and relationships based on a defined (or inferred) schema.
3.  **Graph Construction**: The backend executes Cypher queries to merge extracted nodes/relationships into the Neo4j database. 
4.  **Vector Embedding**: (Optional) Generates vector embeddings for chunks and/or entities to enable hybrid search.

### 3.3 Retrieval Augmented Generation (RAG)
1.  **Query Analysis**: The chatbot analyzes the user's question.
2.  **Retrieval Modes**:
    - **Vector Search**: Finds relevant chunks using similarity search.
    - **Graph Search**: Traverses relationships to find connected context.
    - **Hybrid**: Combines both for maximum context_entity_recall.
3.  **Generation**: The LLM generates a response based on the retrieved graph/text context.

## 4. Security Architecture

### 4.1 Authentication
- **Auth0**: Supports integration for user authentication (optional via `VITE_SKIP_AUTH`).
- **Neo4j Utils**: Direct database authentication handling via `neo4j-driver`.

### 4.2 Credential Management (Secret Vault)
To avoid hardcoding sensitive keys, the application implements a local **Secret Vault**:
- **Encryption**: API keys (OpenAI, Diffbot, etc.) are encrypted using a locally generated key (`.vault.key`).
- **Storage**: Encrypted secrets are stored in `.secrets.json.enc` within the Docker volume.
- **Fallback Logic**: The `get_llm` factory intelligently checks:
    1.  Environment Variables
    2.  Secret Vault (Runtime detection)
    3.  Graceful degradation if keys are missing.

## 5. Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | UI Rendering and State Management |
| **UI Library** | Neo4j NDL | Standardized Neo4j look and feel |
| **Backend** | Python 3.12, FastAPI | REST API & Async Task Management |
| **Orchestration** | LangChain | LLM chains and Graph Transformers |
| **Database** | Neo4j 5.23+ | Graph Storage + APOC + GDS |
| **Containerization** | Docker, Docker Compose | Deployment and Orchestration |

## 6. Key Configuration & Environment
The application is highly configurable via Environment Variables (see `README.md` for full list).
- **`VITE_LLM_MODELS_PROD`**: Controls the list of available models in the UI.
- **`NEO4J_URI` / `NEO4J_PASSWORD`**: Database connection details.
- **`OPENAI_API_KEY` / `DIFFBOT_API_KEY`**: Core Model Credentials.

## 7. Recent Improvements (Feb 2026)
- **Universal Model Support**: Refactored `get_llm` to support dynamic configuration for generic providers (Anthropic, Fireworks, etc.) without code changes.
- **Robust Error Handling**: Fixed specific model name mapping issues (e.g., `OPENAI_GPT_4O` -> `gpt-4o`) to prevent SDK errors.
- **UX Enhancements**: Implemented a Saffron/Orange theme for better visibility and simplified the header navigation.
