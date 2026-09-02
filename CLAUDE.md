# CLAUDE.md — OmniChat Repository Instructions

## Mission

Build and maintain OmniChat, a ChatGPT-style multimodal AI workspace using Next.js, TypeScript, MongoDB, and multiple AI provider APIs.

The supplied screenshots are the UI reference. Match their interaction model and visual hierarchy closely while using original product branding/assets.

## Non-negotiable rules

1. **Do not stop after scaffolding.** Continue through the available implementation phases until the requested scope is complete or blocked by a concrete external dependency.
2. **Keep the application runnable after every phase.**
3. **Never expose API keys client-side.**
4. **Never invent successful provider responses.** Surface real provider errors.
5. **Keep providers behind adapters.** UI code must not import OpenAI/Claude/Gemini SDK clients directly.
6. **MongoDB is the source of truth for conversation state.**
7. **Do not add a separate backend project unless explicitly required.** Use Next.js route handlers for the subject-project MVP.
8. **Use TypeScript strict mode.** Avoid `any` except at well-contained external boundaries.
9. **Validate all external input.** Use a schema validator such as Zod.
10. **Treat model output as untrusted.** Safely render Markdown and never blindly inject raw HTML.
11. **Never execute uploaded files or model-generated code on the main application server.**
12. **Do not over-engineer infrastructure for a 1–2 day subject project.** Prefer simple, working code.

## Product priorities

Priority order:

1. Chat UX
2. MongoDB persistence
3. Multi-provider chat
4. `+` mode menu
5. Image input
6. Document input
7. Voice-to-text
8. Image generation
9. Search/tools
10. Advanced router/ensemble/RAG/editing

## UI rules

- Dark mode should be deep black/charcoal, not a generic blue AI theme.
- Sidebar, composer, plus-menu, message layout, spacing, icon buttons, and selection states should closely follow the supplied screenshots.
- Use subtle borders and surfaces.
- Avoid gradients unless genuinely useful.
- Avoid excessive glassmorphism.
- Avoid giant hero sections.
- Avoid decorative cards that do not represent a real feature.
- Buttons must have real actions or be clearly disabled.
- Use Lucide icons or another consistent icon set.

## Provider architecture

Use:

```ts
interface AIProvider {
  id: string;
  getModels(): Promise<ModelDefinition[]>;
  chat(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): AsyncIterable<AIChunk>;
  capabilities: ProviderCapabilities;
}
```

Providers should be registered in one place. Environment variables enable/disable them.

Required adapters:

- OpenAI
- Gemini
- Anthropic
- xAI

Optional adapters:

- DeepSeek
- Mistral
- Groq
- Cohere
- Perplexity
- Together
- Fireworks
- Cerebras
- OpenRouter

## Database

Use MongoDB with these core collections:

- users
- conversations
- messages
- file_assets
- generations
- tool_calls
- usage_events

Use indexes from PRD.md.

## Chat message persistence

Persist message status transitions:

```text
pending → streaming → complete
                     ↘ error
                     ↘ cancelled
```

Never save a partially streamed answer as `complete`.

## Error behavior

Normalize errors into stable internal codes.

Never expose:

- stack traces
- provider secrets
- MongoDB URI
- internal file paths
- authorization tokens

## Files

Accept only explicit formats from the PRD. Validate:

- extension
- MIME type
- size
- safe filename

Do not trust filename extensions alone.

## `+` menu

Required options:

- Add photos & files
- Add from library
- Create image
- Web search

The plus menu is part of the primary UX and should be polished, keyboard accessible, and dismissible with Escape/outside click.

## Voice

Use browser MediaRecorder. Send audio to the configured transcription adapter. Put the returned transcript into the composer; do not auto-submit unless the user explicitly enables that behavior.

## Testing

At minimum, after meaningful changes:

```bash
npm run lint
npm run typecheck
npm run build
```

Add focused tests for:

- provider registry
- model routing
- request validation
- MongoDB message persistence
- file validation

## Environment

Create `.env.example` with every expected variable and never commit `.env.local`.

## Working style

Before editing:

1. Inspect the repository.
2. Read PRD.md.
3. Read SECURITY.md.
4. Identify what is already implemented.
5. Reuse existing abstractions instead of creating duplicates.

When implementing:

1. Make the smallest coherent change.
2. Keep types precise.
3. Test the changed path.
4. Fix regressions immediately.
5. Continue to the next phase without asking for confirmation unless blocked.

## Stop conditions

Stop only when:

- the specified project scope is complete,
- an external API credential or unavailable external dependency is required and cannot be reasonably stubbed behind an adapter, or
- an explicit user instruction says to stop.

Even when an API key is missing, implement and test the adapter boundary and provide a graceful runtime message so the rest of the app remains usable.
