# AGENT.md — Master Build Prompt for OmniChat

> **Paste/use this file as the single master instruction for a coding agent.**

You are the lead full-stack engineer responsible for implementing the OmniChat project described in `PRD.md`.

Your job is to **build the project, not merely describe it**.

The project is a ChatGPT-style multimodal AI chatbot for an academic subject project, with MongoDB persistence and multiple provider APIs. The product must look and behave closely to the supplied ChatGPT screenshots.

---

# 1. PRIMARY OBJECTIVE

Build a polished, working web application with:

- ChatGPT-like UI.
- Responsive desktop/mobile layout.
- Sidebar with recent conversations.
- MongoDB-persisted chats/messages.
- Multi-provider chat.
- Streaming responses.
- `+` menu with modes/actions.
- Image upload and vision.
- Document analysis.
- Voice-to-text.
- Image generation.
- Provider routing.
- Basic tools.
- Safe error handling.
- Vercel-compatible deployment.

Implement as many phases from `PRD.md` as practical **without breaking previously working features**.

---

# 2. READ FIRST

Before changing code, read:

1. `PRD.md`
2. `CLAUDE.md`
3. `SECURITY.md`
4. `README.md` if present
5. Existing source tree
6. Existing package.json and environment files

If the repository already contains code, preserve useful functionality and refactor rather than blindly replacing it.

---

# 3. PROJECT RULES

## Architecture

Use a single Next.js application.

Preferred structure:

```text
app/
components/
lib/
models/
public/
tests/
```

Do not create a separate `client` and `server` application unless absolutely required by an external service.

## Database

MongoDB is the required database.

Persist:

- users
- conversations
- messages
- file assets
- generations
- tool calls
- usage events

Use indexed queries for conversation lists and message retrieval.

## AI providers

Implement provider adapters for:

### Required

- OpenAI
- Google Gemini
- Anthropic Claude
- xAI Grok

### Adapter-ready / optional

- DeepSeek
- Mistral
- Groq
- Cohere
- Perplexity
- Together AI
- Fireworks AI
- Cerebras
- OpenRouter

Do not assume every provider supports every modality. The adapter must declare capabilities.

---

# 4. CURRENT PROVIDER POLICY

At implementation time, consult official provider documentation for current model IDs, limits, request shapes, and supported modalities. Never hard-code assumptions from old tutorials.

Important current capabilities include:

- Gemini has a Files API for reusable media inputs. citeturn780431search2turn780431search4
- xAI currently exposes Responses APIs and image generation functionality. citeturn780431search5turn780431search8
- Anthropic exposes tool use as a first-class capability. citeturn636307view4
- Groq exposes OpenAI-compatible transcription endpoints using Whisper models and TTS endpoints. citeturn543073search1turn543073search0
- Mistral provides multimodal, OCR and transcription models/services. citeturn780431search0turn780431search1
- OpenRouter can provide a unified model/provider layer with routing/fallback and multimodal APIs; use it as an optional aggregator, not a hard dependency. citeturn599614search2turn599614search8

Provider features change. Build configuration-driven capability metadata.

---

# 5. EXECUTION MODE

Work in phases but **do not stop just because a phase is complete**.

After each phase:

```text
1. Typecheck
2. Lint
3. Test relevant code
4. Build
5. Fix errors
6. Continue
```

If an optional API key is missing:

- Keep the provider disabled.
- Keep the adapter implemented if feasible.
- Show a clear runtime message.
- Continue building the rest of the application.

Do not ask for permission to proceed from one phase to the next.

---

# 6. PHASE 0 — AUDIT AND BOOTSTRAP

Inspect the repository.

Determine:

- framework
- existing pages
- existing components
- database code
- installed AI SDKs
- environment setup

Then establish:

- TypeScript strict mode
- Tailwind
- shadcn/ui if suitable
- ESLint
- formatting
- environment validation
- MongoDB utility
- basic error handling

Create/update:

```text
PRD.md
CLAUDE.md
AGENT.md
SECURITY.md
.env.example
README.md
```

Do not put secrets in any tracked file.

---

# 7. PHASE 1 — CHATGPT-LIKE UI

Recreate the supplied interaction pattern.

## Sidebar

Implement:

- product title/logo text
- search icon
- sidebar toggle
- navigation rows
- recent conversations
- active conversation highlight
- account/profile footer

## Main chat

Implement:

- empty state
- conversation title
- message list
- user messages
- assistant messages
- streaming cursor
- copy response
- retry
- stop generation

## Composer

Match the supplied screenshots closely.

Must include:

```text
+  Ask anything  microphone  send
```

Use the `+` button to open a polished menu.

Do not use giant input boxes or blue/purple dashboard styling.

---

# 8. PHASE 2 — MONGODB

Create MongoDB models/repositories for:

```text
users
conversations
messages
file_assets
generations
tool_calls
usage_events
```

Implement:

- create conversation
- list conversations
- rename conversation
- delete conversation
- save message
- load messages
- update streaming status

Important:

```text
Do not depend on localStorage as the source of truth.
```

Local storage may be used only for non-critical UI preferences.

---

# 9. PHASE 3 — INTERNAL AI GATEWAY

Create a provider-neutral gateway.

Use an interface similar to:

```ts
interface AIProvider {
  id: string;
  capabilities: ProviderCapabilities;
  getModels(): Promise<ModelDefinition[]>;
  chat(req: AIRequest): Promise<AIResponse>;
  stream(req: AIRequest): AsyncIterable<AIChunk>;
}
```

Add:

```text
registry.ts
router.ts
normalizers.ts
error-mapper.ts
```

Do not import provider SDKs from React components.

---

# 10. PHASE 4 — OPENAI

Implement:

- server-side client
- chat
- streaming
- normalized usage
- model metadata
- vision/file handling where supported
- image generation integration where selected
- transcription integration if configured

Use current official APIs and model names at implementation time.

---

# 11. PHASE 5 — GEMINI

Implement:

- chat
- streaming where supported by chosen endpoint
- image/vision inputs
- document/media file inputs
- model capability metadata

If using Gemini Files API, store provider-side file IDs in MongoDB `providerFileRefs` when this reduces repeated uploads. Do not treat provider files as the application's only source of truth.

---

# 12. PHASE 6 — CLAUDE

Implement:

- messages/chat
- streaming
- vision where supported
- tool-calling normalization

Keep Anthropic-specific request shapes inside the adapter.

---

# 13. PHASE 7 — GROK / XAI

Implement:

- chat/responses
- streaming if available in selected endpoint
- image generation
- capability discovery

Keep image generation behind the same internal image-service interface as other providers.

---

# 14. PHASE 8 — MODEL SELECTOR

Implement a polished model selector similar to modern AI assistants.

Options should include:

```text
Auto
OpenAI
Gemini
Claude
Grok
```

If configured:

```text
DeepSeek
Mistral
Groq
Cohere
Perplexity
Together
Fireworks
Cerebras
OpenRouter
```

Only show providers that are configured and operational unless there is an explicit “show unavailable” setting.

---

# 15. PHASE 9 — AUTO ROUTING

Create simple deterministic routing first.

Rules:

```text
image attachment → vision-capable model
image generation mode → image provider
voice input → transcription → chat
search mode → search tool/provider
normal chat → configured default model
```

Then add fallback:

```text
selected provider fails
        ↓
compatible fallback
        ↓
response
```

Do not implement expensive multi-model judging yet.

---

# 16. PHASE 10 — PLUS MENU

Implement exact interaction pattern requested in the screenshots.

When user clicks `+`, show:

```text
Add photos & files
Add from library
Create image
Web search
```

Use polished icons, hover states, keyboard navigation, and outside-click dismissal.

Click behavior:

### Add photos & files
Open file picker.

### Add from library
Show recent file assets from MongoDB.

### Create image
Switch composer mode to image generation.

### Web search
Switch composer to search mode.

---

# 17. PHASE 11 — FILE UPLOADS

Support:

```text
png
jpg/jpeg
webp
pdf
txt
docx
csv
xlsx
```

For each file:

1. Validate.
2. Generate safe filename.
3. Store metadata.
4. Process/extract text when relevant.
5. Save provider file references when appropriate.
6. Attach the resulting `fileAssetId` to the user message.

Never:

- execute files
- trust filename paths
- expose storage credentials
- accept arbitrary server-side URLs as local paths

---

# 18. PHASE 12 — IMAGE VISION

User can upload an image and ask questions.

UI:

- preview image in composer
- show removable attachment chip
- on send, show thumbnail in user message
- show assistant analysis

Normalize images before provider request when required by provider constraints.

---

# 19. PHASE 13 — DOCUMENT ANALYSIS

Implement the fastest reliable path.

### PDF
Extract text.

### DOCX
Extract document text.

### TXT
Read directly.

### CSV/XLSX
Extract sheet/row/column information and summarize safely.

For an academic MVP, simple extraction is acceptable.

Design the API so later phases can add:

```text
chunking
embeddings
retrieval
citations
```

---

# 20. PHASE 14 — VOICE INPUT

Implement:

```text
microphone click
      ↓
recording state
      ↓
MediaRecorder
      ↓
POST /api/audio/transcribe
      ↓
STT provider
      ↓
transcript
      ↓
composer
```

The user must be able to edit the transcript before sending.

Primary quick integration:

- Whisper via OpenAI or Groq-compatible transcription.

Use the adapter abstraction so either can be selected by configuration.

---

# 21. PHASE 15 — IMAGE GENERATION

Implement an image provider abstraction.

```ts
interface ImageProvider {
  generate(req: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}
```

Start with one provider.

Good candidates:

- OpenAI image generation
- xAI image generation
- OpenRouter unified image API where convenient

Do not build three implementations before one works.

Persist:

- prompt
- provider
- model
- output reference
- timestamp
- conversation ID

---

# 22. PHASE 16 — SEARCH

Create:

```ts
interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
```

Add one working search provider first.

Potential providers:

- Perplexity
- OpenAI web search/tooling
- another configured web-search API

Return normalized source objects.

Render source links in assistant responses.

---

# 23. PHASE 17 — TOOLS

Implement a tool registry.

Start with:

- calculator
- web search
- file search
- image generation

Persist tool calls in MongoDB.

Tool results are untrusted input and must be bounded before being passed back into a model.

---

# 24. PHASE 18 — MULTI-MODEL COMPARE

Add optional compare mode.

```text
User question
 ↓
GPT ─────┐
Gemini ──┼── parallel
Claude ──┤
Grok ────┘
 ↓
Show separate results
```

Do not silently collapse disagreements.

UI can say:

> “Compared across 4 models”

but must not say:

> “This is guaranteed to be the correct answer.”

---

# 25. PHASE 19 — SYNTHESIS/JUDGE

Optional after compare mode works.

Use a separate selected model to synthesize responses.

Input:

```text
original question
candidate responses
known tool results
```

Output:

```text
final answer
confidence/limitations where appropriate
```

Keep all candidate answers available for audit/debug.

---

# 26. PHASE 20 — RAG

Only implement after document analysis works.

Pipeline:

```text
file
 ↓
extract
 ↓
chunk
 ↓
embed
 ↓
store vectors
 ↓
retrieve
 ↓
model
```

MongoDB may be used for vector search if the selected Atlas setup supports the required functionality. Otherwise isolate vector storage behind an interface so a dedicated vector service can be introduced later.

---

# 27. PHASE 21 — DOCUMENT EDITING

Build a structured edit-plan system.

Example:

```json
{
  "operation": "replace_text",
  "fileId": "...",
  "target": "Introduction",
  "replacement": "..."
}
```

Then:

```text
LLM plan
 ↓
Zod validation
 ↓
executor
 ↓
verification
 ↓
new artifact
```

Never claim an edit succeeded until the executor confirms it.

---

# 28. PHASE 22 — PROJECTS

Add:

- project collection
- project files
- project conversations
- project instructions
- project-specific context

Keep the UI close to the supplied sidebar pattern.

---

# 29. PHASE 23 — TTS

Add:

- “Read aloud” action on assistant messages.
- TTS adapter.
- audio player.
- loading/error states.

Start with one provider.

---

# 30. PHASE 24 — USAGE + OBSERVABILITY

Track:

- provider
- model
- input tokens
- output tokens
- latency
- approximate cost
- success/failure

Never log raw API keys.

Do not expose internal provider response payloads unless explicitly needed for debugging.

---

# 31. PHASE 25 — SECURITY HARDENING

Implement:

- request validation
- file limits
- rate limiting
- secure response headers
- safe Markdown rendering
- prompt-injection-resistant file processing patterns
- provider error normalization
- secret-safe logging
- abort/timeout handling

Read `SECURITY.md` and follow it exactly.

---

# 32. PHASE 26 — TESTING

Add focused tests for:

- provider registry
- model routing
- request schemas
- MongoDB repositories
- message persistence
- file validation
- prompt normalization

Add at least one E2E smoke path:

```text
open app
→ new chat
→ send message
→ receive streamed response
→ refresh
→ open same chat
→ verify history remains
```

If time allows, test file upload and image mode too.

---

# 33. PHASE 27 — DEPLOYMENT

Ensure:

```text
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

work.

Prepare Vercel deployment.

Create/update `.env.example`.

Verify all server-only secrets are marked as server-only and are never imported into client components.

Add `GET /api/health`.

---

# 34. DESIGN QUALITY BAR

Do not generate generic “AI SaaS” UI.

Avoid:

- purple gradients
- excessive shadows
- huge cards
- unnecessary badges
- giant marketing headers
- fake dashboard charts
- fake data
- random glass effects

Prefer:

- black/charcoal dark mode
- clean typography
- compact sidebar
- subtle separators
- familiar chat interaction patterns
- smooth but restrained animations
- rounded controls
- polished empty state

The user should immediately understand:

> “This is a ChatGPT-like assistant with multiple models and tools.”

---

# 35. FINAL QUALITY CHECK

Before declaring completion, verify:

### UI

- [ ] sidebar works
- [ ] recent chats work
- [ ] active chat state works
- [ ] composer works
- [ ] `+` menu works
- [ ] voice button works
- [ ] model selector works
- [ ] mobile layout works
- [ ] dark mode looks correct

### AI

- [ ] OpenAI works if key configured
- [ ] Gemini works if key configured
- [ ] Claude works if key configured
- [ ] Grok works if key configured
- [ ] fallback errors are readable
- [ ] streaming works

### Files

- [ ] image upload
- [ ] PDF/document handling
- [ ] file metadata in MongoDB
- [ ] file size/type validation

### Media

- [ ] STT
- [ ] image generation

### Persistence

- [ ] chats survive refresh
- [ ] messages survive refresh
- [ ] attachments remain linked

### Security

- [ ] secrets server-only
- [ ] validation
- [ ] safe rendering
- [ ] rate limiting on expensive endpoints where practical
- [ ] no secret logging

### Delivery

- [ ] build passes
- [ ] README complete
- [ ] `.env.example` complete
- [ ] PRD present
- [ ] CLAUDE.md present
- [ ] AGENT.md present
- [ ] SECURITY.md present

---

# 36. FINAL INSTRUCTION TO THE AGENT

**Do not merely create a plan. Implement the application.**

When a feature is blocked by a missing third-party API key:

1. Finish the integration boundary.
2. Add clear configuration/error handling.
3. Continue implementing other phases.

When one provider fails:

1. Preserve the rest of the application.
2. Show a useful error.
3. Allow the user to switch providers.

When time is limited:

```text
Protect the core:
Chat → MongoDB → Multi-model → + Menu → Image/File → Voice → Image Generation
```

Then add advanced functionality in order.

**Never sacrifice a working core for a half-finished advanced feature.**
