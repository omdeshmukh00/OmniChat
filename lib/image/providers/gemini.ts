import { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from "../types";
import { getServerEnv } from "@/lib/security/env";
import { AppError } from "@/lib/security/errors";

export class GeminiImageProvider implements ImageProvider {
  public readonly id = "google";
  public readonly name = "Google Gemini";
  public readonly defaultModel = "gemini-2.5-flash-image";

  public isConfigured(): boolean {
    const env = getServerEnv();
    return Boolean(
      env.GOOGLE_GENERATIVE_AI_API_KEY &&
        env.GOOGLE_GENERATIVE_AI_API_KEY.trim().length > 0
    );
  }

  public async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.isConfigured()) {
      throw new AppError({
        code: "UNCONFIGURED_PROVIDER",
        message: "Google Generative AI API key is not configured.",
        statusCode: 400,
      });
    }

    const env = getServerEnv();
    const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
    const model = this.defaultModel;
    const promptText = request.prompt.trim();

    try {
      // Explicitly send request to model gemini-2.5-flash-image
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const rawMsg = errJson.error?.message || `Gemini API error HTTP ${res.status}`;
        
        // Detect quota / billing rate-limit errors from Google Gemini API
        const isQuotaError =
          res.status === 429 ||
          rawMsg.includes("Quota exceeded") ||
          rawMsg.includes("limit: 0") ||
          rawMsg.includes("RESOURCE_EXHAUSTED");

        if (isQuotaError) {
          throw new AppError({
            code: "IMAGE_PROVIDER_QUOTA",
            message: "Google image generation is currently unavailable because this API key has no available image-generation quota.",
            statusCode: 429,
          });
        }

        throw new AppError({
          code: "PROVIDER_ERROR",
          message: rawMsg,
          statusCode: res.status,
        });
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];

      let base64Data = "";
      let mimeType = "image/png";

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Data = part.inlineData.data;
          if (part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          break;
        }
      }

      if (!base64Data) {
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: "Gemini API did not return image binary data for the prompt.",
          statusCode: 502,
        });
      }

      return {
        success: true,
        type: "image",
        image: {
          mimeType,
          data: base64Data,
        },
        prompt: promptText,
        model,
        provider: this.id,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err instanceof Error ? err.message : "Image generation request failed.",
        statusCode: 500,
      });
    }
  }
}
