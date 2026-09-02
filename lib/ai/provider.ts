import {
  AIChunk,
  AIRequest,
  AIResponse,
  ModelDefinition,
  ProviderCapabilities,
} from "./types";

export abstract class AIProvider {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly capabilities: ProviderCapabilities;

  /**
   * Returns whether the provider has the required API keys/credentials configured.
   */
  public abstract isConfigured(): boolean;

  /**
   * Returns list of models supported by this provider.
   */
  public abstract getModels(): Promise<ModelDefinition[]>;

  /**
   * Generate non-streaming chat response.
   */
  public abstract chat(request: AIRequest): Promise<AIResponse>;

  /**
   * Stream chat response chunk by chunk.
   */
  public abstract stream(request: AIRequest): AsyncIterable<AIChunk>;
}
