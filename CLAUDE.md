# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Invisible HR — an AI-powered HR automation platform (hackathon MVP) with three phases: contract generation, HR chatbot, and compliance monitoring. Uses OpenAI GPT-4o throughout.

## Development Commands

### Backend (server/)
```bash
cd server
npm install
npm run dev          # Start Express server with nodemon (port 5000)
npm run seed         # Seed SQLite database with sample data
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Run migrations
npx prisma studio    # Open database GUI browser
node scripts/seed-vectors.js   # Seed Pinecone with policy embeddings
node scripts/test-pinecone.js  # Test Pinecone connection and setup
```

### Frontend (client/)
```bash
cd client
npm install
npm run dev    # Start Next.js dev server (port 3000)
npm run build  # Production build
npm run lint   # ESLint
```

Both servers must run simultaneously. No test framework is configured.

## Architecture

**Monorepo with two independent apps** — no shared workspace tooling. Each has its own `package.json` and `node_modules`.

### Backend (`server/`)
- **Express** server with controller-based routing in `server.js`
- **Prisma ORM** with SQLite (`server/prisma/schema.prisma`) — two models: `Employee` (with email-based lookup) and `Policy`
- **Pinecone** vector DB for semantic policy search (config in `server/config/pinecone.js`)
- **OpenAI embeddings** via `server/utils/embeddings.js` using `text-embedding-3-small`

Controllers map directly to features:
- `docController.js` — Phase 1: generates HTML employment contracts via GPT-4o prompt
- `chatController.js` — Phase 2: HR chatbot using OpenAI Function Calling with two tools (`getLeaveBalance`, `readPolicy` via Pinecone vector search)
- `complianceController.js` — Phase 3: queries employees with visa expiry within 90 days, assigns severity levels
- `employeeController.js` — email-based employee lookup

### Frontend (`client/`)
- **Next.js 14 App Router** with TypeScript
- **Tailwind CSS** for styling with custom component classes in `globals.css` (`.card`, `.btn-primary`, `.btn-secondary`, `.input-field`)
- Pages at `app/` route to corresponding components in `components/`
- All interactive components use `'use client'` directive
- API calls go to `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000`)

### Data Flow
1. Frontend components call backend REST API endpoints
2. Backend controllers fetch employee/policy data from Prisma (SQLite)
3. For chat: OpenAI Function Calling decides which tool to invoke, then backend executes the tool and sends results back to OpenAI for a final response
4. For policy search: query is embedded via OpenAI, searched in Pinecone, results returned as RAG context

## Environment Variables

Backend (`server/.env`): `OPENAI_API_KEY`, `PORT` (5000), `DATABASE_URL` (file:./dev.db), `PINECONE_API_KEY`, `PINECONE_INDEX`

Frontend (`client/.env.local`): `NEXT_PUBLIC_API_URL` (http://localhost:5000)

## Key Patterns

- Employee identification uses **email** as primary lookup (with `employeeId` as fallback)
- Chat endpoint injects employee context into the system prompt so the AI doesn't re-ask for identity
- `border-radius: 5px` is applied via inline styles throughout the frontend (not via Tailwind's `rounded`)
- JSDoc-style `/** */` comments are used for controller functions
- Seed data includes three employees: hazim@company.com, sarah@company.com, ahmad@company.com
