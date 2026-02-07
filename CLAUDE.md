# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Invisible HR — an AI-powered HR automation platform (hackathon MVP) with four main features: contract generation, HR chatbot, compliance monitoring, resume extraction, and a knowledge base management system. Uses **Ollama** (local LLM) for all AI tasks — no cloud AI dependencies.

## Development Commands

### Backend (server/)
```bash
cd server
npm install
npm run dev          # Start Express server with nodemon (port 5000)
npm run seed         # Seed SQLite database with sample data
npm run test         # Run tests (node tests/utils.test.js)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Run migrations
npx prisma studio    # Open database GUI browser
```

### Frontend (client/)
```bash
cd client
npm install
npm run dev    # Start Next.js dev server (port 3000)
npm run build  # Production build
npm run lint   # ESLint
```

### Prerequisites
Both backend and frontend must run simultaneously. Additionally:
- **Ollama** must be running locally (default: `http://localhost:11434`) with models `llama3.1` (chat) and `nomic-embed-text` (embeddings) pulled
- **ChromaDB** must be running locally (default: `http://localhost:8000`)

## Architecture

**Monorepo with two independent apps** — no shared workspace tooling. Each has its own `package.json` and `node_modules`.

### Backend (`server/`)
- **Express** server with controller-based routing (all routes defined inline in `server.js`)
- **Prisma ORM** with SQLite (`server/prisma/schema.prisma`) — two models: `Employee` (with unique email) and `Policy`
- **ChromaDB** for vector search (config in `server/config/chromadb.js`, collection: `hr-knowledge`)
- **Ollama** for embeddings via `server/utils/embeddings.js` using `nomic-embed-text` model
- **Multer** for file uploads (10MB max, accepts PDF/DOCX/TXT)
- **Puppeteer** for HTML-to-PDF rendering (contract generation)

Controllers map directly to features:
- `docController.js` — Contract generation via Ollama + PDF rendering via Puppeteer
- `chatController.js` — HR chatbot using ChromaDB vector search + Ollama RAG
- `complianceController.js` — Visa expiry monitoring within 90 days, assigns severity levels
- `employeeController.js` — Email-based employee lookup
- `resumeController.js` — Resume data extraction via Ollama with Zod schema validation
- `kbController.js` — Knowledge base CRUD: file upload, list, download, update, soft delete, restore, bulk delete. Stores files on filesystem (`server/uploads/knowledge-base/`) with a JSON index, and chunks+embeds content to ChromaDB

Utility modules:
- `utils/embeddings.js` — Ollama embedding generation
- `utils/kbUtils.js` — Filesystem helpers for KB file management
- `utils/chunker.js` — Text chunking for embeddings

### Frontend (`client/`)
- **Next.js 14 App Router** with TypeScript
- **Tailwind CSS** for styling with custom component classes in `globals.css` (`.card`, `.btn-primary`, `.btn-secondary`, `.input-field`)
- **lucide-react** for icons
- All interactive components use `'use client'` directive
- API calls go to `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000`)

Page routes:
- `/` — HR Chat interface (main dashboard)
- `/contract` — Contract generator
- `/compliance` — Compliance dashboard
- `/resume` — Resume extractor
- `/kb/[category]` — Knowledge base (dynamic category pages)
- `/chat` — Chat page

### Data Flow
1. Frontend components call backend REST API endpoints
2. Backend controllers fetch employee/policy data from Prisma (SQLite)
3. For chat: query is embedded via Ollama, searched in ChromaDB, results returned as RAG context to Ollama for response generation
4. For KB: files stored on filesystem, chunked, embedded via Ollama, and indexed in ChromaDB for semantic search

## API Endpoints

```
GET  /api/employee/by-email/:email         — Employee lookup by email
POST /api/contract/generate                — Generate HTML contract
POST /api/contract/render-pdf              — Render HTML to PDF
POST /api/chat                             — HR chatbot
GET  /api/compliance/check                 — Check all visa expirations
GET  /api/compliance/employee/:id          — Single employee compliance
POST /api/resume/extract                   — Extract data from resume (multipart)
POST /api/kb/upload                        — Upload KB file (multipart)
GET  /api/kb/files                         — List KB files
GET  /api/kb/files/:id/download            — Download KB file
PUT  /api/kb/files/:id                     — Update KB file metadata
DELETE /api/kb/files/:id                   — Soft delete KB file
POST /api/kb/files/:id/restore             — Restore deleted KB file
POST /api/kb/files/bulk-delete             — Bulk delete KB files
```

## Environment Variables

Backend (`server/.env`): `OLLAMA_BASE_URL` (http://localhost:11434), `OLLAMA_CHAT_MODEL` (llama3.1), `CHROMADB_URL` (http://localhost:8000), `PORT` (5000), `DATABASE_URL` (file:./dev.db)

Frontend (`client/.env.local`): `NEXT_PUBLIC_API_URL` (http://localhost:5000)

## Key Patterns

- Employee identification uses **email** as primary lookup (with `employeeId` as fallback)
- Chat endpoint injects employee context into the system prompt so the AI doesn't re-ask for identity
- KB files use soft delete with restore capability; physical files stored under `server/uploads/knowledge-base/{category}/`
- `border-radius: 5px` is applied via inline styles throughout the frontend (not via Tailwind's `rounded`)
- JSDoc-style `/** */` comments are used for controller functions
- Seed data includes three employees: hazim@company.com, sarah@company.com, ahmad@company.com
