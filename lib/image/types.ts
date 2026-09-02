export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  size?: string;
  referenceImages?: string[];
}

export interface ImageGenerationResponse {
  success: boolean;
  type: "image";
  image?: {
    mimeType: string;
    data?: string; // base64 string
    assetUrl?: string;
  };
  prompt: string;
  model: string;
  provider: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  error?: string;
}

export interface ImageProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}
