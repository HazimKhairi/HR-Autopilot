# 👁️ Invisible HR - AI-Powered HR Automation MVP

> **Hackathon MVP**: Complete working system for automated HR workflows using AI

## 🎯 Overview

Invisible HR is a comprehensive HR automation platform that leverages OpenAI's GPT-4o to streamline three critical HR functions:

- **Phase 1**: Intelligent Document Generation (Employment Contracts)
- **Phase 2**: Conversational HR Assistant (Self-Service Chatbot)
- **Phase 3**: Proactive Compliance Intelligence (Visa Expiration Monitoring)

## 🏗️ Tech Stack

### Backend

- **Runtime**: Node.js + Express
- **Database**: Prisma ORM with SQLite (fast local testing)
- **AI**: OpenAI API (gpt-4o with Function Calling)

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 📁 Project Structure

```
invisible-hr/
├── server/                      # Backend (Node.js + Express)
│   ├── controllers/
│   │   ├── docController.js     # Phase 1: Contract Generation
│   │   ├── chatController.js    # Phase 2: HR Chatbot
│   │   └── complianceController.js # Phase 3: Compliance Alerts
│   ├── prisma/
│   │   ├── schema.prisma        # Database Schema
│   │   └── seed.js              # Sample Data (Hazim + Policies)
│   ├── server.js                # Main Express Server
│   ├── package.json
│   └── .env.example             # Environment Variables Template
│
└── client/                      # Frontend (Next.js 14)
    ├── app/
    │   ├── layout.tsx           # Root Layout
    │   ├── page.tsx             # Main Dashboard
    │   └── globals.css          # Global Styles
    ├── components/
    │   ├── ContractGenerator.tsx    # Phase 1 UI
    │   ├── ChatInterface.tsx        # Phase 2 UI
    │   └── ComplianceDashboard.tsx  # Phase 3 UI
    ├── package.json
    └── tailwind.config.js
```

## 🚀 Quick Start Guide

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Step 1: Backend Setup

```bash
cd invisible-hr/server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here

# Initialize database and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed the database with sample data
npm run seed

# Start the backend server
npm run dev
```

Backend will run on **http://localhost:5000**

### Step 2: Frontend Setup

Open a new terminal:

```bash
cd invisible-hr/client

# Install dependencies
npm install

# The .env.local is already configured for localhost
# If needed, verify it points to: NEXT_PUBLIC_API_URL=http://localhost:5000

# Start the frontend
npm run dev
```

Frontend will run on **http://localhost:3000**

### Step 3: Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

You should see the Invisible HR dashboard with all three phases!

## 🎓 How to Use Each Phase

### Phase 1: Contract Generator 📄

1. Click on "Use Existing Employee" or "Custom Data"
2. For existing: Enter Employee ID `1` (Hazim)
3. For custom: Fill in the form fields
4. Click "Generate Contract with AI"
5. View the generated HTML contract
6. Download it using the button

**How it works**:

- Uses OpenAI GPT-4o to generate legally compliant contracts
- Automatically includes country-specific labor laws
- Formats output in clean HTML

### Phase 2: HR Assistant Chat 💬

1. Type a question in the chat interface
2. Try these examples:
   - "How much leave do I have?"
   - "What is the lunch policy?"
   - "Tell me about remote work"
3. The AI will automatically use the right tool to answer

**How it works**:

- Uses OpenAI Function Calling to decide which tool to use
- **Tool 1** (`getLeaveBalance`): Queries database for leave info
- **Tool 2** (`readPolicy`): Searches policy database (RAG)
- Returns conversational, accurate responses

### Phase 3: Compliance Dashboard 🔍

1. The dashboard loads automatically
2. View alerts for employees with visas expiring in <90 days
3. See severity levels (Critical, Warning, Info)
4. Click "Refresh" to check again

**How it works**:

- Queries database for upcoming expiration dates
- Calculates days until expiry
- Assigns severity based on urgency:
  - **Critical** (Red): <30 days
  - **Warning** (Orange): 30-60 days
  - **Info** (Blue): 60-90 days

## 🗄️ Database Schema

### Employee Model

```prisma
model Employee {
  id              Int       @id @default(autoincrement())
  name            String
  role            String
  salary          Int
  country         String
  leaveBalance    Int
  visaExpiryDate  DateTime?
}
```

### Policy Model

```prisma
model Policy {
  id        Int      @id @default(autoincrement())
  content   String   // Policy text for RAG
}
```

### Sample Data (Seeded)

- **Employee**: Hazim (ID: 1) - Software Engineer, Visa expires in 30 days
- **Policies**: Lunch allowance, Annual leave, Remote work

## 🔌 API Endpoints

### Phase 1: Document Generation

```
POST /api/contract/generate
Body: { employeeId: 1 } or { customData: {...} }
```

### Phase 2: Chat Assistant

```
POST /api/chat
Body: { message: "How much leave do I have?", employeeId: 1 }
```

### Phase 3: Compliance

```
GET /api/compliance/check
GET /api/compliance/employee/:id
```

## 🛠️ Development Commands

### Backend

```bash
npm run dev          # Start dev server with nodemon
npm run seed         # Re-seed database
npx prisma studio    # Open database GUI
```

### Frontend

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Run production build
```

## 🧪 Testing the System

### Test Scenario 1: Contract Generation

1. Generate contract for Hazim (ID: 1)
2. Verify it includes Malaysia labor laws
3. Download and inspect the HTML

### Test Scenario 2: Chat Function Calling

1. Ask "How much leave do I have?"
2. Check that it returns Hazim's leave balance (12 days)
3. Ask "What is the lunch policy?"
4. Check that it returns the policy text from database

### Test Scenario 3: Compliance Alerts

1. Refresh the compliance dashboard
2. Verify Hazim appears with a CRITICAL alert
3. Check that days until expiry is ~30 days
4. Verify the alert message and action required

## 🎨 UI Features

- **Responsive Design**: Works on mobile and desktop
- **Real-time Updates**: Chat messages appear instantly
- **Color-Coded Alerts**: Visual severity indicators
- **Smooth Animations**: Tailwind transitions
- **Clean Typography**: Inter font from Google Fonts

## 📝 Environment Variables

### Backend (.env)

```env
OPENAI_API_KEY=sk-your-key-here
PORT=5000
DATABASE_URL="file:./dev.db"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🚨 Troubleshooting

### Backend won't start

- Check that OpenAI API key is set in `.env`
- Run `npx prisma generate` to generate client
- Ensure port 5000 is not in use

### Frontend can't connect

- Verify backend is running on port 5000
- Check `.env.local` has correct API URL
- Check browser console for CORS errors

### Database errors

- Delete `prisma/dev.db` and run migrations again
- Run `npx prisma migrate reset` to reset database
- Re-run `npm run seed` after reset

### OpenAI API errors

- Verify your API key is valid and has credits
- Check you're using GPT-4o model (requires appropriate tier)
- Review OpenAI status page for outages

## 🎯 Demo Script for Judges

### 1-Minute Pitch

"Invisible HR automates the most time-consuming HR tasks using AI. Watch as we generate a legal contract, answer employee questions instantly, and proactively catch compliance issues—all powered by GPT-4o."

### Live Demo Flow

1. **Show Dashboard** - "Here are our three phases"
2. **Generate Contract** - Click button, show instant result
3. **Ask Chatbot** - Type "How much leave do I have?" → See function calling
4. **Show Compliance** - Point out the critical alert for Hazim

### Key Talking Points

- ✅ Uses latest OpenAI features (Function Calling)
- ✅ Full-stack TypeScript architecture
- ✅ Real database with Prisma ORM
- ✅ Production-ready UI with Next.js 14
- ✅ Proactive intelligence (not reactive)

## 🔮 Future Enhancements

- [ ] Multi-language contract generation
- [ ] Email notifications for compliance alerts
- [ ] Advanced RAG with vector embeddings
- [ ] Integration with HRIS systems
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard

## 👥 Team Credits

Built with ❤️ for [Your Hackathon Name]

## 📄 License

MIT License - Free to use and modify

---

**Ready to revolutionize HR? Let's go! 🚀**
