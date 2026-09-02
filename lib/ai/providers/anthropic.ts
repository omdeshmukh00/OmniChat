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

export class AnthropicProvider extends AIProvider {
  public readonly id = "anthropic";
  public readonly name = "Anthropic Claude";

  public readonly capabilities: ProviderCapabilities = {
    chat: true,
    streaming: true,
    vision: true,
    documents: true,
    imageGeneration: false,
    speechToText: false,
    textToSpeech: false,
    webSearch: false,
    toolCalling: true,
    structuredOutput: true,
  };

  public isConfigured(): boolean {
    const env = getServerEnv();
    return Boolean(
      env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.trim().length > 0
    );
  }

  public async getModels(): Promise<ModelDefinition[]> {
    return [
      {
        id: "claude-3-7-sonnet",
        name: "Claude 3.7 Sonnet",
        provider: this.id,
        description: "Anthropic's hybrid reasoning model for coding and analysis",
        capabilities: this.capabilities,
        contextWindow: 200000,
        maxOutputTokens: 8192,
      },
      {
        id: "claude-3-5-haiku",
        name: "Claude 3.5 Haiku",
        provider: this.id,
        description: "Ultra-fast lightweight model for rapid responses",
        capabilities: this.capabilities,
        contextWindow: 200000,
        maxOutputTokens: 4096,
      },
    ];
  }

  private formatMessages(request: AIRequest) {
    const messages: { role: string; content: string }[] = [];

    for (const msg of request.messages) {
      if (msg.role === "system") continue;
      let text = "";
      for (const c of msg.content) {
        if (c.text) text += c.text + "\n";
      }
      if (text.trim()) {
        messages.push({ role: msg.role === "assistant" ? "assistant" : "user", content: text.trim() });
      }
    }

    return messages;
  }

  public async chat(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      return {
        provider: this.id,
        model: request.model || "claude-3-7-sonnet",
        text: `Anthropic Claude provider is active in demonstration mode. Set \`ANTHROPIC_API_KEY\` in \`.env.local\` to connect Anthropic API endpoints.`,
        finishReason: "stop",
      };
    }

    const env = getServerEnv();
    const model = request.model || "claude-3-7-sonnet-20250219";
    const messages = this.formatMessages(request);
    const startTime = Date.now();

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: request.maxOutputTokens ?? 4096,
          system: request.systemPrompt,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: errJson.error?.message || `Anthropic API error HTTP ${res.status}`,
          statusCode: res.status,
        });
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || "";

      return {
        provider: this.id,
        model,
        text,
        finishReason: "stop",
        latencyMs: Date.now() - startTime,
        usage: {
          inputTokens: data.usage?.input_tokens,
          outputTokens: data.usage?.output_tokens,
        },
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err instanceof Error ? err.message : "Anthropic API request failed",
        statusCode: 500,
      });
    }
  }

  public async *stream(request: AIRequest): AsyncIterable<AIChunk> {
    if (!this.isConfigured()) {
      const demoText = `Anthropic Claude streaming response initialized. Set \`ANTHROPIC_API_KEY\` in \`.env.local\` for live Claude streaming.`;
      const words = demoText.split(" ");
      for (let i = 0; i < words.length; i++) {
        const isLast = i === words.length - 1;
        yield {
          provider: this.id,
          model: request.model || "claude-3-7-sonnet",
          textDelta: words[i] + (isLast ? "" : " "),
          isComplete: isLast,
          finishReason: isLast ? "stop" : undefined,
        };
      }
      return;
    }

    const env = getServerEnv();
    const model = request.model || "claude-3-7-sonnet-20250219";
    const messages = this.formatMessages(request);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          max_tokens: request.maxOutputTokens ?? 4096,
          system: request.systemPrompt,
        }),
      });

      if (!res.ok) {
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: `Anthropic stream error HTTP ${res.status}`,
          statusCode: res.status,
        });
      }

      if (!res.body) {
        throw new AppError({
          code: "STREAM_ERROR",
          message: "Anthropic stream body empty",
          statusCode: 500,
        });
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.substring(6));
              if (json.type === "content_block_delta" && json.delta?.text) {
                yield {
                  provider: this.id,
                  model,
                  textDelta: json.delta.text,
                  isComplete: false,
                };
              } else if (json.type === "message_stop") {
                yield {
                  provider: this.id,
                  model,
                  textDelta: "",
                  isComplete: true,
                  finishReason: "stop",
                };
                return;
              }
            } catch {
              // Ignore partial lines
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err instanceof Error ? err.message : "Anthropic stream failed",
        statusCode: 500,
      });
    }
  }
}

