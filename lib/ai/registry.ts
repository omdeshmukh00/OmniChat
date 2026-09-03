import { AIProvider } from "./provider";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { AnthropicProvider } from "./providers/anthropic";
import { XAIProvider } from "./providers/xai";
import { HuggingFaceProvider } from "./providers/huggingface";
import { AIRequest, ModelDefinition } from "./types";
import { AppError } from "@/lib/security/errors";

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, AIProvider> = new Map();

  private constructor() {
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new XAIProvider());
    this.registerProvider(new HuggingFaceProvider());
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): AIProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new AppError({
        code: "INVALID_PROVIDER",
        message: `Provider '${id}' is not registered in the system catalog.`,
        statusCode: 400,
      });
    }
    return provider;
  }

  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  public getConfiguredProviders(): AIProvider[] {
    return this.getAllProviders().filter((p) => p.isConfigured());
  }

  public async getAllModels(): Promise<ModelDefinition[]> {
    const allModels: ModelDefinition[] = [];
    for (const provider of this.providers.values()) {
      const models = await provider.getModels();
      const isConfigured = provider.isConfigured();
      allModels.push(
        ...models.map((m) => ({
          ...m,
          isAvailable: isConfigured,
        }))
      );
    }
    return allModels;
  }

  /**
   * Auto-routing helper: select best available provider based on request features
   */
  public selectProvider(request: AIRequest): AIProvider {
    if (request.provider && request.provider !== "auto") {
      return this.getProvider(request.provider);
    }

    const configured = this.getConfiguredProviders();

    if (configured.length === 0) {
      return this.getProvider("huggingface");
    }

    // Routing rules
    if (request.mode === "image") {
      const imageGen = configured.find((p) => p.capabilities.imageGeneration);
      if (imageGen) return imageGen;
    }

    if (request.attachments && request.attachments.length > 0) {
      const vision = configured.find((p) => p.capabilities.vision);
      if (vision) return vision;
    }

    return configured[0];
  }
}

export const providerRegistry = ProviderRegistry.getInstance();
