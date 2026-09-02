# Project PRD — OmniChat Multimodal AI Workspace

**Status:** Build-ready academic project specification  
**Target:** 1–2 day functional MVP, with extensible phases  
**Primary stack:** Next.js + TypeScript + MongoDB + Vercel  
**Database:** MongoDB  
**UI reference:** Supplied ChatGPT screenshots in the conversation

--- 

## 1. Product Summary

OmniChat is a ChatGPT-style multimodal AI assistant that exposes multiple leading AI providers through one interface. Users can chat, switch models, upload images/documents, use voice input, generate images, search the web, and later invoke tools or file-editing workflows.

The project is intentionally designed as a **thin AI orchestration layer** rather than a new foundation model. Provider APIs are isolated behind adapters so models can be added, removed, or replaced without rewriting the UI or core chat logic.

### Core demo promise

> **One familiar chat interface, multiple AI models, multimodal input, and creative tools.**

This is an academic subject project, so the first release must prioritize visible functionality, reliability, clean UX, and ease of deployment over enterprise infrastructure.

---

## 2. Goals

### Primary goals

1. Reproduce the **interaction model and visual hierarchy** of the supplied ChatGPT screenshots without copying proprietary branding or assets.
2. Provide a single chat interface for multiple model providers.
3. Store users, conversations, messages, files, generations, settings, and usage metadata in MongoDB.
4. Support text, image, document, and voice input.
5. Support image generation.
6. Provide an extensible provider/tool architecture.
7. Keep secrets server-side and deployable to Vercel.
8. Provide a single repository that an AI coding agent can implement phase-by-phase without changing architecture midway.

### Secondary goals

- Model auto-selection.
- Web search mode.
- Document extraction and analysis.
- Structured tool calling.
- Export/share capabilities.
- Cost and latency telemetry.

---

## 3. Non-Goals for the 1–2 Day MVP

Do **not** make these blockers for the first demo:

- Fine-tuning models.
- Training a model.
- Complex multi-agent autonomy.
- Browser/computer-use automation.
- Production billing/subscriptions.
- Kubernetes.
- Distributed workers.
- Dedicated vector database.
- Heavy enterprise RBAC.
- Fully autonomous code execution.
- Perfect cross-provider parity.

Those belong to later phases.

---

## 4. Target Users

### Primary

Students and developers who want one interface to test multiple AI providers and multimodal workflows.

### Secondary

Teachers/evaluators who need a clear demonstration of AI APIs, multimodal processing, persistence, and software integration.

---

## 5. Core User Experience

### 5.1 Main layout

The application should closely follow the supplied ChatGPT screenshots:

```text
┌───────────────────────────────────────────────────────┐
│ Left Sidebar                    Main Chat              │
│                                                       │
│ Brand / product name             Header / model       │
│ Search                          New chat/actions      │
│ Projects                        Conversation          │
│ Scheduled                        messages             │
│ Plugins/Tools                                         │
│ Codex / Code                                           │
│ More                              ───────────────     │
│                                                       │
│ Recent chats                      + Ask anything       │
│ Recent chat 1                    ┌───────────────┐    │
│ Recent chat 2                    │ mode menu     │    │
│ Recent chat 3                    │ files         │    │
│                                  │ create image  │    │
│                                  │ web search    │    │
│                                  └───────────────┘    │
│                                                       │
│ Account / profile                                    │
└───────────────────────────────────────────────────────┘
```

### 5.2 Sidebar

Match screenshot 1's structure:

- Product wordmark at top.
- Search icon.
- Sidebar collapse button.
- Navigation items with familiar icon + text pattern.
- Recent conversation list.
- Selected conversation has subtle rounded dark highlight.
- User/profile area anchored to bottom.
- Sidebar scrolls independently from main chat.
- Desktop sidebar should be approximately 300–360px wide; final dimensions should be tuned visually rather than treated as a fixed contract.

Suggested navigation for this project:

- New Chat
- Search
- Projects (optional Phase 2)
- Tools / Plugins
- Code / Analyze (optional Phase 2)
- More
- Recents

Do not present unsupported features as functional. If an item is not implemented, hide it or show a clearly labeled disabled state.

### 5.3 Chat area

- Neutral/black visual system for dark mode, not the generic blue AI-dashboard look.
- Large centered empty-state composer.
- Messages use generous vertical rhythm.
- Assistant responses support Markdown, tables, links, inline code, fenced code blocks, and copy action.
- Streaming response must render progressively.
- Stop-generation control should be available during streaming.
- Error state must be shown in the conversation rather than only in browser console.

### 5.4 Composer

The composer is one of the highest-priority UI components.

The supplied screenshot shows:

- Rounded dark input container.
- `+` action button at left.
- Placeholder: `Ask anything`.
- Composer grows for multi-line text.
- Voice microphone action.
- Submit action.
- Context/tool menu opens from the `+` button.

### 5.5 `+` menu

The `+` button should open a popover/sheet visually matching screenshot 2.

Required initial actions:

1. **Add photos & files** — upload image/document files.
2. **Add from library** — browse files already associated with the current account/project; MVP can be a simple list from MongoDB.
3. **Create image** — switches composer into image-generation mode.
4. **Web search** — switches into web-search mode.

Additional Phase 2+ actions:

- Analyze spreadsheet
- Analyze PDF
- Voice input
- Code/data analysis
- Generate document
- Generate presentation
- Use tools

### 5.6 Voice control

The supplied screenshot 3 shows a minimal microphone control.

Requirements:

- Click microphone to begin recording.
- Show recording state.
- Stop recording.
- Send audio to STT provider.
- Insert transcript into composer.
- User can edit transcript before submitting.
- Display a useful fallback error if microphone permission is denied.

---

## 6. Functional Requirements

## FR-1: Conversations

- Create new conversation.
- Auto-title conversation from first meaningful user message.
- Rename conversation.
- Delete conversation.
- Persist conversation history in MongoDB.
- Load conversation from sidebar.
- Preserve message order.
- Persist provider/model used for each assistant message.
- Persist attachment references.
- Persist generation/tool metadata where available.

## FR-2: Chat Completion

- Accept text input.
- Send normalized internal request to provider adapter.
- Stream output where provider supports it.
- Render partial output.
- Support cancel/abort.
- Save final assistant response.
- Handle provider timeout, rate limit, invalid key, and generic errors.

## FR-3: Model Selector

At minimum, expose:

- Auto
- OpenAI
- Google Gemini
- Anthropic Claude
- xAI Grok

Also make the provider registry capable of adding:

- DeepSeek
- Mistral
- Groq
- Cohere
- Perplexity
- Together AI
- Fireworks AI
- Cerebras
- OpenRouter

The UI should derive model availability from a typed model catalog rather than hard-coded component branches.

## FR-4: Auto Mode

MVP Auto mode may use a deterministic rule-based router:

- General text → configured default model.
- Image input → model with vision capability.
- Image generation intent → image generation provider.
- Web search intent → search-capable provider/tool.
- Audio input → STT first, then normal chat.
- Document analysis → document extraction + selected model.

Later phases can add scoring and multi-model voting.

## FR-5: Image Understanding

- Accept image uploads.
- Validate MIME type and file size.
- Send image as supported URL/base64/provider file reference.
- Preserve attachment metadata.
- Display thumbnail in user message.
- Allow questions about image contents.

## FR-6: Document Analysis

Initial support:

- PDF
- DOCX
- TXT
- CSV/XLSX

MVP approach:

- Extract text server-side where practical.
- Limit content to a safe configurable size.
- Pass extracted/relevant content to a capable model.
- Store extracted metadata, not necessarily raw provider payloads.

Later phases can introduce chunking, embeddings, retrieval, and citations.

## FR-7: Image Generation

- Composer can enter image mode from `+` menu.
- User enters image prompt.
- Server calls configured image provider.
- Show generation progress.
- Save generation record.
- Display generated image.
- Allow opening/downloading the resulting image via the app UI.

## FR-8: Speech-to-Text

- Browser records audio.
- Server receives multipart audio.
- Server calls configured transcription API.
- Return transcript.
- Put transcript into composer.

For a quick MVP, Whisper-compatible endpoints can be used. Groq currently exposes OpenAI-compatible transcription endpoints using Whisper models; OpenAI also maintains dedicated transcription documentation. Provider capabilities and model names change, so model IDs must be environment/config driven rather than scattered through the code. citeturn543073search1turn636307view2

## FR-9: Tool/Plugin Framework

Implement a typed registry even if only a few tools are enabled in MVP.

```ts
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: unknown;
  capabilities: string[];
  execute(input: unknown, ctx: ToolContext): Promise<ToolResult>;
}
```

Initial tools:

- Calculator
- Web Search
- File Text Search
- Image Generation

Future tools:

- Python/data analysis
- Spreadsheet edits
- DOCX edits
- PPTX generation
- Browser retrieval
- Structured database querying

---

## 7. Provider/API Catalog

The architecture must support direct providers and aggregator providers. **Do not assume a single universal API contract beyond the internal adapter interface.**

### Tier 1 — Required for MVP

| Provider | Primary use | Adapter | Notes |
|---|---|---|---|
| OpenAI | Chat, vision, image, audio, tools | `OpenAIAdapter` | Use current Responses API/features where appropriate. |
| Google Gemini | Chat, multimodal, files, image/video-capable workflows depending on model | `GeminiAdapter` | Gemini Files API supports reusable media uploads. citeturn780431search2turn780431search4 |
| Anthropic | Chat, vision, tools | `AnthropicAdapter` | Claude tool use is a first-class API capability. citeturn636307view4turn599614search5 |
| xAI | Chat, tools, image generation and other modalities depending on model | `XAIAdapter` | Current xAI docs expose Responses, image-generation tool, and image generation endpoints. citeturn780431search5turn780431search8turn780431search13 |

### Tier 2 — Strong optional integrations

| Provider | Useful capability |
|---|---|
| DeepSeek | Cost-efficient reasoning/coding and OpenAI-compatible chat interface. Current docs list V4 models and OpenAI/Anthropic-compatible access. citeturn973987search0turn973987search4 |
| Mistral | Multimodal, OCR, audio/transcription, generalist models. citeturn780431search0turn780431search1 |
| Groq | Fast inference and Whisper-compatible STT; TTS is also available. citeturn543073search1turn543073search0 |
| Cohere | Chat, embeddings, reranking, RAG-oriented workflows. citeturn973987search2turn973987search5 |
| Perplexity | Search/research-oriented models and APIs. |
| Together AI | Open-model inference and multimodal/image ecosystem. |
| Fireworks AI | Fast hosted model inference and model-serving APIs. |
| Cerebras | High-throughput inference. |
| OpenRouter | Unified access to many models/providers; useful as fallback/router layer. Current OpenRouter docs describe auto routing, provider routing, fallback, and unified multimodal APIs. citeturn599614search0turn599614search2turn599614search8 |

### Provider design rule

Every provider must implement a capability declaration:

```ts
export type ProviderCapabilities = {
  chat: boolean;
  streaming: boolean;
  vision: boolean;
  documents: boolean;
  imageGeneration: boolean;
  speechToText: boolean;
  textToSpeech: boolean;
  webSearch: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
};
```

The router must select only models/providers whose capabilities match the request.

### API key policy

All provider secrets are server-only environment variables. The browser must never receive raw provider API keys.

Suggested environment variables:

```env
OPENAI_API_KEY=
GOOGLE_GEMINI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
DEEPSEEK_API_KEY=
MISTRAL_API_KEY=
GROQ_API_KEY=
COHERE_API_KEY=
PERPLEXITY_API_KEY=
TOGETHER_API_KEY=
FIREWORKS_API_KEY=
CEREBRAS_API_KEY=
OPENROUTER_API_KEY=
```

Only configured keys should enable a provider in the runtime model catalog.

---

## 8. Data Model — MongoDB

MongoDB is the system of record for application state.

### User

```ts
type User = {
  _id: ObjectId;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultProvider?: string;
    defaultModel?: string;
  };
  createdAt: Date;
  updatedAt: Date;
};
```

### Conversation

```ts
type Conversation = {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  modelPreference?: string;
  mode: 'chat' | 'image' | 'search' | 'voice' | 'document';
  pinned?: boolean;
  archived?: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

### Message

```ts
type Message = {
  _id: ObjectId;
  conversationId: ObjectId;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: Array<{
    type: 'text' | 'image' | 'file' | 'audio' | 'tool-call' | 'tool-result';
    text?: string;
    fileId?: ObjectId;
    mimeType?: string;
    url?: string;
    name?: string;
  }>;
  provider?: string;
  model?: string;
  status: 'pending' | 'streaming' | 'complete' | 'error' | 'cancelled';
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
  };
  latencyMs?: number;
  error?: {
    code?: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
};
```

### FileAsset

```ts
type FileAsset = {
  _id: ObjectId;
  userId: ObjectId;
  conversationId?: ObjectId;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  storageKey?: string;
  providerFileRefs?: Record<string, string>;
  extractedText?: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  createdAt: Date;
};
```

### Generation

```ts
type Generation = {
  _id: ObjectId;
  userId: ObjectId;
  conversationId?: ObjectId;
  type: 'image' | 'audio' | 'document';
  prompt?: string;
  provider: string;
  model?: string;
  outputUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};
```

### ToolCall

```ts
type ToolCall = {
  _id: ObjectId;
  conversationId: ObjectId;
  messageId?: ObjectId;
  toolId: string;
  input: unknown;
  output?: unknown;
  status: 'pending' | 'running' | 'complete' | 'error' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
};
```

### UsageEvent

```ts
type UsageEvent = {
  _id: ObjectId;
  userId?: ObjectId;
  provider: string;
  model?: string;
  route: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  latencyMs?: number;
  success: boolean;
  createdAt: Date;
};
```

### Recommended indexes

- `conversations: { userId: 1, updatedAt: -1 }`
- `messages: { conversationId: 1, createdAt: 1 }`
- `files: { userId: 1, createdAt: -1 }`
- `files: { conversationId: 1, createdAt: -1 }`
- `toolCalls: { conversationId: 1, createdAt: 1 }`
- `usageEvents: { userId: 1, createdAt: -1 }`

---

## 9. File Handling

### Supported MVP files

- Images: PNG, JPEG, WebP
- PDF
- DOCX
- TXT
- CSV
- XLSX

### Security limits

Configurable environment values:

```env
MAX_FILE_SIZE_MB=20
MAX_FILES_PER_MESSAGE=10
MAX_EXTRACTED_TEXT_CHARS=200000
MAX_AUDIO_SIZE_MB=25
```

### Processing rules

1. Verify file extension **and** detected MIME type.
2. Reject unsupported formats.
3. Reject oversized files.
4. Store metadata before expensive processing.
5. Scan/sanitize filenames.
6. Never use the user-supplied filename as a filesystem path.
7. Strip executable content from any file type that could be interpreted.
8. Do not execute uploaded files.

---

## 10. Document Editing Architecture — Future

For file modifications, use a structured action plan rather than asking the model to directly mutate a binary file.

```text
User request
    ↓
LLM planning
    ↓
Structured edit plan
    ↓
Validation
    ↓
Document executor
    ↓
Verification
    ↓
New artifact
```

Example:

```json
{
  "operation": "replace_text",
  "target": "Executive Summary",
  "replacement": "..."
}
```

The system must not claim that a file was changed unless the executor confirms success.

---

## 11. Search / Web Mode — Future but Prepared in MVP

The internal tool contract should allow a web search tool without coupling the UI to a specific vendor.

```ts
interface SearchTool {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
```

Search results should preserve:

- title
- URL
- snippet
- source/domain
- timestamp where available

Generated answers should reference retrieved sources when the selected search provider returns source metadata.

---

## 12. UI Component Map

```text
app/
├── page.tsx
├── chat/[conversationId]/page.tsx
└── api/

components/
├── layout/
│   ├── Sidebar.tsx
│   ├── SidebarHeader.tsx
│   ├── RecentChats.tsx
│   └── ProfileFooter.tsx
├── chat/
│   ├── ChatView.tsx
│   ├── MessageList.tsx
│   ├── MessageItem.tsx
│   ├── Composer.tsx
│   ├── ComposerPlusMenu.tsx
│   ├── ModelSelector.tsx
│   ├── AttachmentTray.tsx
│   └── VoiceButton.tsx
├── files/
│   ├── FilePicker.tsx
│   ├── FileChip.tsx
│   └── FilePreview.tsx
├── generation/
│   └── GeneratedImageCard.tsx
└── common/
```

---

## 13. API Routes

Suggested Next.js route structure:

```text
/api/chat
/api/conversations
/api/conversations/[id]
/api/messages
/api/models
/api/files/upload
/api/files/[id]
/api/vision
/api/image/generate
/api/audio/transcribe
/api/search
/api/tools/[toolId]
/api/health
```

### `/api/chat`

Input:

```ts
{
  conversationId?: string;
  mode: 'auto' | 'chat' | 'search' | 'image' | 'voice' | 'document';
  provider?: string;
  model?: string;
  messages: MessageInput[];
  attachmentIds?: string[];
}
```

Response:

- SSE stream for chat.
- JSON response for non-streaming operations where appropriate.

---

## 14. Internal AI Request Contract

All providers should normalize into one internal request.

```ts
export type AIRequest = {
  mode: 'chat' | 'vision' | 'document' | 'search' | 'image';
  model?: string;
  messages: NormalizedMessage[];
  attachments?: NormalizedAttachment[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxOutputTokens?: number;
};
```

Normalized response:

```ts
export type AIResponse = {
  provider: string;
  model: string;
  text?: string;
  output?: unknown;
  toolCalls?: ToolCallRequest[];
  usage?: Usage;
  finishReason?: string;
};
```

---

## 15. Tech Stack

### Application

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React

### AI/provider SDKs

- OpenAI SDK
- Google GenAI SDK
- Anthropic SDK
- xAI SDK or OpenAI-compatible client where suitable
- Optional provider SDKs only when required

### Data

- MongoDB Atlas
- Mongoose or MongoDB native driver
- Choose **one** database access style and use it consistently.

### File processing

Prefer lightweight server-side packages suitable for Vercel/serverless limits; for larger workloads move processing behind a worker in a later phase.

### Deployment

- Vercel for Next.js
- MongoDB Atlas
- Optional object storage for generated/uploaded files

### Developer tooling

- Git + GitHub
- ESLint
- Prettier
- TypeScript strict mode
- Vitest/Jest for unit tests where useful
- Playwright for smoke/E2E tests if time permits

---

## 16. Security Requirements

See `SECURITY.md` for the detailed security checklist.

Minimum requirements:

- Never expose provider keys to browser JavaScript.
- Validate all request bodies.
- Enforce file-size and content-type limits.
- Sanitize filenames.
- Prevent path traversal.
- Do not execute uploaded files.
- Apply rate limits to expensive endpoints.
- Do not log API keys, raw authentication tokens, or sensitive file contents.
- Treat model output as untrusted data.
- Escape/render Markdown safely.
- Never blindly render model-generated HTML.
- Add prompt-injection warnings for document/web content in later phases.
- Restrict CORS appropriately if custom domains/backends are introduced.

---

## 17. Error Handling

### Provider errors

Normalize external errors into:

```text
AUTH_ERROR
RATE_LIMITED
TIMEOUT
INVALID_REQUEST
CONTEXT_TOO_LARGE
CONTENT_FILTERED
PROVIDER_UNAVAILABLE
UNKNOWN_PROVIDER_ERROR
```

UI should show a human-readable message and a retry action where safe.

### User-facing principles

Bad:

> `500 Internal Server Error`

Good:

> `Gemini is temporarily unavailable. Try again or switch to another model.`

Never reveal secrets, internal stack traces, database connection strings, or provider tokens.

---

## 18. Performance Requirements

For the academic MVP:

- First visible assistant token target: < 3–5 seconds under normal provider conditions.
- UI must stay responsive while requests are streaming.
- Abort should cancel the network request when possible.
- Sidebar history should render without waiting for all message bodies.
- Avoid sending unnecessary conversation history.
- Compress/resize image input when safe before provider upload.

---

## 19. Accessibility Requirements

- Keyboard-accessible composer.
- Visible focus states.
- Proper ARIA labels for icon-only buttons.
- Escape closes popovers.
- Enter sends; Shift+Enter inserts newline.
- Do not rely on color alone for state.
- Screen-reader-friendly error and loading messages.

---

## 20. Acceptance Criteria — MVP

A build is considered MVP-complete when all are true:

### Chat

- [ ] User can create a new conversation.
- [ ] User can send a message.
- [ ] Assistant response streams.
- [ ] Markdown is rendered correctly.
- [ ] Conversation persists after refresh.
- [ ] Recent chats appear in sidebar.
- [ ] User can switch model/provider.

### Files

- [ ] User can open the `+` menu.
- [ ] User can upload an image.
- [ ] User can upload a PDF/TXT/DOCX where parser support is available.
- [ ] User can ask questions about supported uploads.
- [ ] Attachment metadata is persisted in MongoDB.

### Image generation

- [ ] User can switch to Create Image mode.
- [ ] Prompt reaches server.
- [ ] Generated image displays in chat.
- [ ] Generation metadata is saved.

### Voice

- [ ] Microphone button exists.
- [ ] Browser recording works in supported browsers.
- [ ] Transcript is returned.
- [ ] Transcript enters composer.

### Security

- [ ] API keys are never sent to client.
- [ ] File limits work.
- [ ] Invalid upload types are rejected.
- [ ] Errors do not leak secrets.

### Deployment

- [ ] Environment variables are documented in `.env.example`.
- [ ] App builds successfully for Vercel.
- [ ] MongoDB connection works in deployed environment.
- [ ] Health endpoint returns a simple status.

---

# 21. Phase Roadmap — Maximum Practical Scope

The coding agent may continue through as many phases as time allows, but every phase must preserve a working application.

## Phase 0 — Repository Bootstrap

- Next.js app
- TypeScript strict
- Tailwind/shadcn
- ESLint/Prettier
- Environment validation
- Base layout
- Dark/light/system theme

## Phase 1 — Chat Shell

- Sidebar
- Empty state
- Composer
- Message rendering
- Streaming architecture
- New chat

## Phase 2 — MongoDB Persistence

- Connection utility
- User/session shape
- Conversation schema
- Message schema
- File schema
- Indexes
- CRUD

## Phase 3 — OpenAI

- Chat adapter
- Streaming
- Error mapping
- Usage capture

## Phase 4 — Gemini

- Gemini adapter
- Multimodal support
- File inputs where useful

Gemini's current Files API supports reusable uploads for media, including images, audio, text, video, and PDF. citeturn780431search2turn780431search3

## Phase 5 — Claude

- Anthropic adapter
- Vision where supported by model
- Tool-calling abstraction

## Phase 6 — Grok

- xAI adapter
- Current response/chat capabilities
- Image generation integration

## Phase 7 — Provider Catalog

- Typed registry
- Provider availability based on env keys
- Model capability metadata
- Model selector UI

## Phase 8 — Auto Router

- Rule-based routing
- Capability matching
- Default/fallback model
- Provider failure fallback

## Phase 9 — `+` Menu

- Upload photos & files
- Library
- Create image
- Web search
- Tool entries

## Phase 10 — Vision

- Image uploads
- Thumbnail preview
- Vision request normalization
- Image-specific models

## Phase 11 — Documents

- PDF extraction
- DOCX extraction
- TXT
- CSV/XLSX basic extraction
- Content limits

## Phase 12 — Voice

- MediaRecorder
- Whisper-compatible transcription
- Transcript insertion
- Recording UI

Groq currently documents Whisper-compatible transcription endpoints and OpenAI-compatible audio APIs, while OpenAI documents transcription and realtime audio capabilities separately. citeturn543073search1turn636307view2

## Phase 13 — Image Generation

- Image mode
- Generate
- Persist result metadata
- Display artifact card

## Phase 14 — Web Search

- Search adapter
- Search tool registry
- Citation-ready result objects
- Search mode UI

## Phase 15 — Tool Calling

- Tool registry
- Calculator
- Search
- File search
- Image generation
- Tool call persistence

## Phase 16 — Multi-Model Comparison

- Optional “Compare” mode
- Parallel provider requests
- Response cards
- Do not claim objective correctness; present responses for comparison.

## Phase 17 — Judge / Synthesizer

- Compare multiple answers
- Ask a separate model to synthesize
- Show which models were consulted
- Preserve original outputs for transparency

## Phase 18 — RAG

- Chunk documents
- Embeddings
- MongoDB-compatible vector search or separate vector service
- Retrieval
- Source attribution

## Phase 19 — Document Editing

- Structured edit plans
- DOCX executor
- XLSX executor
- Artifact generation
- Validation

## Phase 20 — Presentation Generation

- PPTX generator
- Theme/layout templates
- Output artifact storage

## Phase 21 — Audio Output

- TTS provider adapter
- Play assistant response
- Save generation metadata

Groq currently documents TTS endpoints in addition to STT. citeturn543073search0turn543073search4

## Phase 22 — Project Workspace

- Project folders
- Project files
- Project-specific system prompts
- Project conversation history

## Phase 23 — Searchable Library

- File search
- Message search
- Recent activity
- Filters

## Phase 24 — Usage Dashboard

- Token counts
- Approximate cost
- Latency
- Provider/model usage

## Phase 25 — Reliability

- Provider fallback
- Timeout handling
- Retry policy
- Circuit breaker
- Better error taxonomy

## Phase 26 — Security Hardening

- Rate limits
- Abuse controls
- Stronger file validation
- Prompt-injection defenses
- Security headers
- Audit events

## Phase 27 — Testing

- Unit tests for router/provider adapters
- API tests
- Upload tests
- Playwright smoke tests
- Production build test

## Phase 28 — Deployment / Demo Polish

- Vercel deploy
- MongoDB Atlas verification
- `.env.example`
- README
- screenshots
- demo seed data
- final UI polish

---

## 22. Repository Structure

Keep **one repository** and avoid unnecessary client/server split for the initial subject project.

```text
omnichat/
├── app/
│   ├── api/
│   ├── chat/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
├── lib/
│   ├── ai/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── router.ts
│   │   └── providers/
│   ├── db/
│   ├── files/
│   ├── tools/
│   └── validation/
├── models/
├── public/
├── tests/
├── docs/
├── .env.example
├── CLAUDE.md
├── AGENT.md
├── SECURITY.md
├── PRD.md
├── README.md
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 23. Environment Variables

```env
# App
NEXT_PUBLIC_APP_NAME=OmniChat
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
MONGODB_URI=
MONGODB_DB_NAME=omnichat

# Auth (optional MVP)
AUTH_SECRET=

# Providers
OPENAI_API_KEY=
GOOGLE_GEMINI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
DEEPSEEK_API_KEY=
MISTRAL_API_KEY=
GROQ_API_KEY=
COHERE_API_KEY=
PERPLEXITY_API_KEY=
TOGETHER_API_KEY=
FIREWORKS_API_KEY=
CEREBRAS_API_KEY=
OPENROUTER_API_KEY=

# Optional storage
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=

# Limits
MAX_FILE_SIZE_MB=20
MAX_FILES_PER_MESSAGE=10
MAX_AUDIO_SIZE_MB=25
MAX_EXTRACTED_TEXT_CHARS=200000
```

---

## 24. Design Principles

1. **Chat first.** The interface must feel like a chat application, not an admin dashboard.
2. **Black/dark, not neon AI blue.**
3. **Minimal visual noise.**
4. **Motion is functional, not decorative.**
5. **Every clickable control must do something.**
6. **No fake AI outputs.** Provider failures must be explicit.
7. **No hard-coded API key logic in components.**
8. **No provider-specific details leaking into UI components.**
9. **No claims that multiple models produce the “best possible” answer unless a defined evaluation method exists.**
10. **Build breadth only after the core loop works.**

---

## 25. Definition of Done

The project is complete for the subject demonstration when:

- It looks and behaves convincingly like the supplied ChatGPT interaction pattern.
- A user can send and receive a streamed chat response.
- MongoDB stores conversations and message history.
- At least three model providers work; four is preferred.
- `+` opens the mode/tool menu.
- Image upload works.
- At least one document type can be analyzed.
- Voice-to-text works.
- Image generation works.
- App runs locally from documented commands.
- App deploys to Vercel.
- Security baseline is implemented.
- `README.md`, `CLAUDE.md`, `AGENT.md`, and `SECURITY.md` exist.

---

## 26. Current API Documentation References

Use official docs as the source of truth at implementation time because provider model IDs, limits, pricing, and features change.

- OpenAI API docs: https://developers.openai.com/api/docs/
- Gemini API docs: https://ai.google.dev/gemini-api/docs
- Anthropic API/docs: https://platform.claude.com/docs/
- xAI API docs: https://docs.x.ai/
- DeepSeek API docs: https://api-docs.deepseek.com/
- Mistral docs: https://docs.mistral.ai/
- Groq docs: https://console.groq.com/docs/
- Cohere docs: https://docs.cohere.com/
- Perplexity API docs: https://docs.perplexity.ai/
- Together AI docs: https://docs.together.ai/
- Fireworks docs: https://docs.fireworks.ai/
- Cerebras docs: https://inference-docs.cerebras.ai/
- OpenRouter docs: https://openrouter.ai/docs

---

## 27. Final Implementation Rule

**Never let scope expansion break the working core.**

The coding agent must implement in this order:

```text
Working Chat
→ Persistence
→ Providers
→ Multimodal Input
→ Voice
→ Image Generation
→ Search/Tools
→ Advanced orchestration
→ Editing/RAG
→ Hardening
```

At the end of every phase:

1. Run type-check.
2. Run lint.
3. Run relevant tests.
4. Verify the app still starts.
5. Fix regressions before moving forward.

