# OmniChat — Multimodal AI Workspace

OmniChat is a ChatGPT-style multimodal AI assistant application designed as a thin AI orchestration layer that exposes multiple leading AI model providers (OpenAI, Google Gemini, Anthropic Claude, xAI Grok, etc.) through one unified, modern interface.

---

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Dark Mode Charcoal/Black Visual System)
- **Icons**: Lucide React
- **Database**: MongoDB (Mongoose)
- **Validation**: Zod
- **AI Gateway**: Custom provider-agnostic adapter framework

---

## Repository Structure

```text
omnichat/
├── app/
│   ├── api/
│   │   ├── health/route.ts      # Health & DB diagnostic check
│   │   └── models/route.ts      # Active models catalog
│   ├── globals.css              # Dark theme CSS variables
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main ChatGPT workspace layout
│
├── components/
│   ├── chat/
│   │   ├── ChatHeader.tsx       # Top bar with model selector & controls
│   │   ├── EmptyState.tsx       # ChatGPT-style welcome state
│   │   ├── MessageList.tsx      # Message history rendering
│   │   └── ModelSelector.tsx    # Multi-provider model selector dropdown
│   ├── composer/
│   │   ├── Composer.tsx         # Multi-line composer with voice & submit
│   │   └── ComposerPlusMenu.tsx # Popover menu for files, images, search
│   └── sidebar/
│       └── Sidebar.tsx          # Collapsible sidebar with recents & profile
│
├── lib/
│   ├── ai/
│   │   ├── provider.ts          # Base AIProvider abstract class
│   │   ├── registry.ts          # ProviderRegistry catalog & auto-router
│   │   ├── types.ts             # AIRequest, AIResponse, capabilities
│   │   └── providers/           # Provider adapters (OpenAI, Gemini, Claude, Grok)
│   ├── db/
│   │   ├── mongodb.ts           # Mongoose cached connection pool
│   │   └── models/              # User, Conversation, Message, FileAsset, etc.
│   └── security/
│       ├── env.ts               # Server Zod environment validator
│       ├── errors.ts            # Safe error response formatter
│       ├── file-security.ts     # Upload sanitization & MIME validation
│       ├── logger.ts            # Redacted server logger
│       ├── rate-limit.ts        # In-memory rate limiting placeholder
│       └── validation.ts        # Zod request payload schemas
│
├── .env.example                 # Environment variables template
├── AGENT.md                     # Engineering build prompt
├── CLAUDE.md                    # Coding agent instructions
├── PRD.md                       # Product requirement document
├── SECURITY.md                  # Security requirements baseline
├── README.md                    # Project documentation
├── package.json                 # Dependencies & scripts
└── tsconfig.json                # TypeScript strict configuration
```

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure parameters in `.env.local`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/omnichat

# Server Secrets (Server-side only — NEVER expose to browser)
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
HF_TOKEN=

# File Upload Limits
MAX_FILE_SIZE_MB=20
MAX_FILES_PER_MESSAGE=10
```

---

## Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Type Checking**:
   ```bash
   npm run typecheck
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## Implementation Status

- [x] **Phase 0 — Project Bootstrap & Architecture**: Next.js App Router, TypeScript strict mode, Zod security layer, Mongoose database foundation, and `.env.example`.
- [x] **Phase 1 — ChatGPT UI Shell**: Collapsible sidebar, model selector header, welcome state, message list, and multi-line composer with interactive `+` action popover.
- [x] **Phase 2 & 3 — AI Provider Abstraction & DB Models**: `AIProvider` contract, model registry, capability definitions, and Mongoose schemas for Users, Conversations, Messages, FileAssets, Generations, ToolCalls, and UsageEvents.
- [x] **Phase 4 — OpenAI Integration**: Live REST SSE streaming, chat completions, vision, and Whisper STT.
- [x] **Phase 5 — Gemini Integration**: Live Google Gemini REST API adapter with streaming & multimodal support.
- [x] **Phase 6 — Anthropic Claude Integration**: Live Anthropic Messages REST API adapter with streaming & vision.
- [x] **Phase 7 — xAI Grok Integration**: Live xAI Grok REST API adapter with streaming & web search mode.
- [x] **Phase 8+ — Multimodal Features & API Routes**: `/api/chat` SSE stream, `/api/conversations` MongoDB persistence, `/api/files/upload` text extraction, `/api/audio/transcribe` voice input, `/api/image/generate` DALL-E/Grok generation, and `/api/search` web retriever.

---

## Project Status

**OmniChat MVP & Full Multimodal Provider Suite Complete — Ready for Deployment.**

