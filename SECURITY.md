# SECURITY.md — OmniChat Security Requirements

## 1. Security Objective

OmniChat handles user prompts, uploaded documents/images/audio, provider API keys, database records, and potentially untrusted model/tool output.

The security goal is to prevent:

- secret leakage
- unauthorized database access
- arbitrary file execution
- path traversal
- prompt injection from files/web content
- XSS through model output
- excessive API spend
- denial of service through expensive endpoints
- accidental persistence of sensitive provider payloads

This document is a practical security baseline for an academic project and a foundation for future hardening.

---

## 2. Secrets

### Never

- put provider keys in `NEXT_PUBLIC_*`
- expose provider keys in React components
- return provider keys from API routes
- commit `.env.local`
- log API keys
- put keys in screenshots/demo data

### Required

Server-only variables:

```env
OPENAI_API_KEY=
GOOGLE_GEMINI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
...
```

If a provider key is not configured, the provider should simply be disabled.

---

## 3. Environment Validation

Validate environment variables at startup or first server use.

Never silently accept an undefined MongoDB URI or malformed secret.

Use a typed environment module:

```ts
const env = envSchema.parse(process.env);
```

Do not import the server-only environment module into client components.

---

## 4. MongoDB Security

- Use a dedicated application database user.
- Grant only the required permissions.
- Never expose MongoDB URI to the browser.
- Always scope queries by authenticated user identity once auth exists.
- Add indexes for predictable queries.
- Never construct MongoDB filters directly from arbitrary user input without validation.
- Do not use `$where` or arbitrary JavaScript database execution.

Example ownership rule:

```ts
findOne({ _id: conversationId, userId: currentUserId })
```

not merely:

```ts
findOne({ _id: conversationId })
```

---

## 5. Authentication

MVP may use simplified/demo authentication if the course does not require accounts.

If accounts are implemented:

- Use a proven auth framework.
- Use secure HTTP-only cookies where applicable.
- Do not store raw passwords.
- Protect mutation routes.
- Verify ownership of every conversation/file/tool resource.

---

## 6. Input Validation

Validate every external request.

Use Zod or equivalent.

Validate:

- body shape
- query parameters
- route parameters
- enum values
- string length
- attachment counts
- model IDs against an allowlist/catalog
- tool IDs

Never trust the client to enforce business rules.

---

## 7. File Upload Security

Treat uploads as hostile.

### Required checks

1. file size
2. detected MIME type
3. extension allowlist
4. filename sanitization
5. safe storage key
6. maximum extracted text
7. maximum number of attachments

### Never

- execute uploaded files
- import uploaded code as a module
- pass arbitrary file paths to shell commands
- trust a client-provided path

### Filenames

Convert:

```text
../../evil.exe
```

to a safe generated key, for example:

```text
<random-id>.bin
```

Keep the original display filename only as metadata.

---

## 8. Model Output Security

Model-generated content is **untrusted**.

### Markdown

Use a safe Markdown renderer.

### HTML

Do not blindly render raw model-generated HTML with `dangerouslySetInnerHTML`.

If raw HTML is genuinely required later, sanitize it with a reputable sanitizer and a restrictive policy.

### URLs

When converting model output into clickable links:

- require safe protocols (`https`, optionally `http`)
- reject `javascript:` and other dangerous schemes

---

## 9. Prompt Injection

Files, web pages, tool output, and model responses can contain instructions designed to manipulate the assistant.

Treat retrieved content as **data, not instructions**.

System/tool policy should distinguish:

```text
Trusted instructions
Untrusted user content
Untrusted file content
Untrusted web content
Untrusted tool output
```

Do not let a PDF tell the application to reveal environment variables or execute arbitrary tools.

---

## 10. Tool Security

Tools must have:

- explicit IDs
- explicit input schemas
- capability permissions
- bounded inputs
- timeouts
- output-size limits

Never allow arbitrary tool invocation solely because a model generated a tool name.

Only registered tools may execute.

---

## 11. Code Execution

Do **not** execute model-generated code in the main Next.js process.

If code execution is introduced:

```text
LLM
 ↓
validated execution request
 ↓
isolated sandbox
 ↓
resource/time limit
 ↓
result
```

Sandbox requirements:

- no host filesystem access
- no host credentials
- no unrestricted network
- CPU limit
- memory limit
- execution timeout
- maximum output size

---

## 12. Rate Limiting

Expensive endpoints should be rate-limited:

- `/api/chat`
- `/api/image/generate`
- `/api/audio/transcribe`
- `/api/search`
- file upload endpoints
- tool execution endpoints

For a simple deployment, a basic IP/user limit is acceptable. Later use Redis or a managed rate-limiting service.

---

## 13. Spend Protection

Provider APIs can incur charges.

At minimum:

- cap request size
- cap output tokens where reasonable
- cap uploaded file size
- cap audio duration/size
- cap image generation requests
- record usage events

Later add per-user quotas.

---

## 14. Logging

Safe to log:

- request ID
- provider name
- model name
- latency
- success/failure code
- token usage if available

Do not log by default:

- API keys
- authorization tokens
- full raw file contents
- full audio payloads
- password data
- complete sensitive prompts if avoidable

Use redaction for known secrets.

---

## 15. SSRF Protection

If the application accepts remote URLs for documents/images/search tools:

- allowlist protocols
- block localhost
- block link-local addresses
- block private network ranges
- limit redirects
- impose response-size limits
- set request timeouts

Do not directly fetch arbitrary URLs from the server without SSRF protections.

---

## 16. CORS / Headers

Prefer same-origin Next.js API routes for the initial deployment.

Add appropriate security headers, for example:

- `Content-Security-Policy` tuned to the actual app
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`
- frame-ancestors policy via CSP

Do not ship a CSP that blindly permits every origin/script.

---

## 17. Error Messages

User-facing errors must be actionable but non-sensitive.

Good:

> Claude is temporarily unavailable. Switch models or retry.

Bad:

> `AnthropicError: POST https://... Authorization Bearer sk-...`

Always keep stack traces server-side.

---

## 18. File Storage

Use opaque storage keys rather than predictable filenames.

Example:

```text
files/<user-id>/<random-id>
```

Never construct storage paths directly from the original filename.

Signed URLs should be short-lived if private object storage is used.

---

## 19. Database Access Control

Every request handling a resource must establish ownership before reading or modifying it.

Examples:

```text
conversation belongs to user
message belongs to conversation
file belongs to user
file belongs to conversation if attached
```

Do not trust IDs supplied by the browser.

---

## 20. Security Testing Checklist

Before deployment:

- [ ] API keys cannot be found in client bundle.
- [ ] `.env.local` is gitignored.
- [ ] Invalid model IDs are rejected.
- [ ] Unsupported MIME types are rejected.
- [ ] Oversized files are rejected.
- [ ] Path traversal attempts are neutralized.
- [ ] Markdown output is safe.
- [ ] `javascript:` URLs are blocked.
- [ ] Provider errors do not expose secrets.
- [ ] Conversation ownership is enforced.
- [ ] File ownership is enforced.
- [ ] Expensive endpoints have limits.
- [ ] No uploaded file is executed.
- [ ] No model output is treated as trusted instructions.

---

## 21. Security Principle

**Assume every boundary is hostile:**

```text
Browser → API
User → File
File → Model
Web → Model
Model → Tool
Provider → Application
Application → Database
```

Validate at every boundary and keep the trusted computing base small.
