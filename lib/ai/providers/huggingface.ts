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
import { HfInference } from "@huggingface/inference";

export class HuggingFaceProvider extends AIProvider {
  public readonly id = "huggingface";
  public readonly name = "Hugging Face";

  public readonly capabilities: ProviderCapabilities = {
    chat: true,
    streaming: true,
    vision: true,
    documents: true,
    imageGeneration: true,
    speechToText: false,
    textToSpeech: false,
    webSearch: false,
    toolCalling: false,
    structuredOutput: false,
  };

  public isConfigured(): boolean {
    const env = getServerEnv();
    return Boolean(env.HF_TOKEN && env.HF_TOKEN.trim().length > 0);
  }

  public async getModels(): Promise<ModelDefinition[]> {
    return [
      {
        id: "Qwen/Qwen2.5-Coder-32B-Instruct",
        name: "Qwen 2.5 Coder 32B",
        provider: this.id,
        description: "High-intelligence open-weights chat and document analysis model",
        capabilities: this.capabilities,
        contextWindow: 32768,
        maxOutputTokens: 4096,
        isDefault: true,
      },
    ];
  }

  private formatMessages(request: AIRequest) {
    const messages: { role: "user" | "assistant" | "system"; content: string }[] = [];

    for (let i = 0; i < request.messages.length; i++) {
      const msg = request.messages[i];
      const isLastUserMsg = i === request.messages.length - 1 && msg.role === "user";
      const role = msg.role === "assistant" ? "assistant" : "user";
      let textContent = msg.content.map((c) => c.text || "").join("\n").trim();

      if (isLastUserMsg && request.attachments && request.attachments.length > 0) {
        for (const file of request.attachments) {
          if (file.extractedText) {
            textContent += `\n\n[Attached Document: ${file.name}]\n${file.extractedText}`;
          } else {
            textContent += `\n\n[Attached File: ${file.name} (${file.mimeType})]`;
          }
        }
      }

      if (textContent) {
        messages.push({ role, content: textContent });
      }
    }

    return messages;
  }

  public async chat(request: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new AppError({
        code: "PROVIDER_NOT_CONFIGURED",
        message: "Hugging Face HF_TOKEN is not configured.",
        statusCode: 400,
      });
    }

    const env = getServerEnv();
    const token = (env.HF_TOKEN || "").trim();
    const hf = new HfInference(token);
    const model = request.model || "Qwen/Qwen2.5-Coder-32B-Instruct";
    const messages = this.formatMessages(request);
    const startTime = Date.now();

    try {
      const res = await hf.chatCompletion({
        model,
        messages,
        max_tokens: 2048,
      });

      const text = res.choices[0]?.message?.content || "";
      return {
        provider: this.id,
        model,
        text,
        finishReason: "stop",
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err?.message || "Hugging Face API request failed",
        statusCode: 500,
      });
    }
  }

  public async *stream(request: AIRequest): AsyncIterable<AIChunk> {
    if (!this.isConfigured()) {
      throw new AppError({
        code: "PROVIDER_NOT_CONFIGURED",
        message: "Hugging Face HF_TOKEN is not configured.",
        statusCode: 400,
      });
    }

    const env = getServerEnv();
    const token = (env.HF_TOKEN || "").trim();
    const hf = new HfInference(token);
    const model = request.model || "Qwen/Qwen2.5-Coder-32B-Instruct";
    const messages = this.formatMessages(request);

    try {
      const stream = hf.chatCompletionStream({
        model,
        messages,
        max_tokens: 2048,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          yield {
            provider: this.id,
            model,
            textDelta: delta,
            isComplete: false,
          };
        }
      }

      yield {
        provider: this.id,
        model,
        textDelta: "",
        isComplete: true,
        finishReason: "stop",
      };
    } catch (err: any) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err?.message || "Hugging Face stream request failed",
        statusCode: 500,
      });
    }
  }
}
