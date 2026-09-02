import { AIProvider } from "../provider";
import {
  AIChunk,
  AIRequest,
  AIResponse,
  ModelDefinition,
  ProviderCapabilities,
} from "../types";
import { getServerEnv } from "@/lib/security/env";
import { AppError } from "@/lib/security/errors";

export class OpenAIProvider extends AIProvider {
  public readonly id = "openai";
  public readonly name = "OpenAI";

  public readonly capabilities: ProviderCapabilities = {
    chat: true,
    streaming: true,
    vision: true,
    documents: true,
    imageGeneration: true,
    speechToText: true,
    textToSpeech: true,
    webSearch: true,
    toolCalling: true,
    structuredOutput: true,
  };

  public isConfigured(): boolean {
    const env = getServerEnv();
    return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0);
  }

  public async getModels(): Promise<ModelDefinition[]> {
    return [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        provider: this.id,
        description: "High-intelligence flagship model for complex, multimodal tasks",
        capabilities: this.capabilities,
        contextWindow: 128000,
        maxOutputTokens: 4096,
        isDefault: true,
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: this.id,
        description: "Affordable and fast small model for lightweight tasks",
        capabilities: { ...this.capabilities, imageGeneration: false },
        contextWindow: 128000,
        maxOutputTokens: 4096,
      },
      {
        id: "o3-mini",
        name: "o3-mini",
        provider: this.id,
        description: "Reasoning model designed for complex logic, math, and code",
        capabilities: { ...this.capabilities, vision: false, imageGeneration: false },
        contextWindow: 200000,
        maxOutputTokens: 65536,
      },
    ];
  }

  private formatMessages(request: AIRequest) {
    const formatted: { role: string; content: unknown }[] = [];

    if (request.systemPrompt) {
      formatted.push({ role: "system", content: request.systemPrompt });
    }

    for (let i = 0; i < request.messages.length; i++) {
      const msg = request.messages[i];
      const isLastMessage = i === request.messages.length - 1;

      if (isLastMessage && request.attachments && request.attachments.length > 0) {
        const parts: unknown[] = [];
        let combinedText = "";

        for (const c of msg.content) {
          if (c.text) combinedText += c.text + "\n";
        }

        for (const att of request.attachments) {
          if (att.mimeType.startsWith("image/") && att.url) {
            parts.push({ type: "image_url", image_url: { url: att.url } });
          } else if (att.extractedText) {
            combinedText += `\n\n[Attached File: ${att.name}]\n${att.extractedText}`;
          }
        }

        if (combinedText.trim()) {
          parts.unshift({ type: "text", text: combinedText.trim() });
        }

        formatted.push({ role: msg.role, content: parts.length === 1 && typeof parts[0] === "object" && "text" in (parts[0] as object) ? combinedText.trim() : parts });
      } else {
        let textContent = "";
        for (const c of msg.content) {
          if (c.text) textContent += c.text + "\n";
        }
        formatted.push({ role: msg.role, content: textContent.trim() });
      }
    }

    return formatted;
  }

  public async chat(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      return {
        provider: this.id,
        model: request.model || "gpt-4o",
        text: `OpenAI provider is running in demonstration mode. Set \`OPENAI_API_KEY\` in \`.env.local\` to connect live OpenAI endpoints.\n\nReceived prompt: "${request.messages[request.messages.length - 1]?.content[0]?.text || "Hello"}"`,
        finishReason: "stop",
      };
    }

    const env = getServerEnv();
    const model = request.model || "gpt-4o";
    const messages = this.formatMessages(request);
    const startTime = Date.now();

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxOutputTokens ?? 2048,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: errorData.error?.message || `OpenAI API returned error HTTP ${res.status}`,
          statusCode: res.status,
        });
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const finishReason = data.choices?.[0]?.finish_reason || "stop";

      return {
        provider: this.id,
        model,
        text: content,
        finishReason,
        latencyMs: Date.now() - startTime,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err instanceof Error ? err.message : "Failed to communicate with OpenAI API.",
        statusCode: 500,
      });
    }
  }

  public async *stream(request: AIRequest): AsyncIterable<AIChunk> {
    if (!this.isConfigured()) {
      const demoText = `OpenAI provider streaming initialized. Set \`OPENAI_API_KEY\` in \`.env.local\` for live API responses. Prompt processed successfully!`;
      const words = demoText.split(" ");
      for (let i = 0; i < words.length; i++) {
        const isLast = i === words.length - 1;
        yield {
          provider: this.id,
          model: request.model || "gpt-4o",
          textDelta: words[i] + (isLast ? "" : " "),
          isComplete: isLast,
          finishReason: isLast ? "stop" : undefined,
        };
      }
      return;
    }

    const env = getServerEnv();
    const model = request.model || "gpt-4o";
    const messages = this.formatMessages(request);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxOutputTokens ?? 2048,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: errorData.error?.message || `OpenAI API error HTTP ${res.status}`,
          statusCode: res.status,
        });
      }

      if (!res.body) {
        throw new AppError({
          code: "STREAM_ERROR",
          message: "OpenAI stream body is empty",
          statusCode: 500,
        });
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (trimmed === "data: [DONE]") {
            yield {
              provider: this.id,
              model,
              textDelta: "",
              isComplete: true,
              finishReason: "stop",
            };
            return;
          }
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.substring(6));
              const delta = json.choices?.[0]?.delta?.content || "";
              const finishReason = json.choices?.[0]?.finish_reason;
              if (delta || finishReason) {
                yield {
                  provider: this.id,
                  model,
                  textDelta: delta,
                  isComplete: Boolean(finishReason),
                  finishReason,
                };
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err instanceof Error ? err.message : "OpenAI streaming request failed.",
        statusCode: 500,
      });
    }
  }
}

