import { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from "./types";
import { GeminiImageProvider } from "./providers/gemini";
import { HuggingFaceImageProvider } from "./providers/huggingface";
import { AppError } from "@/lib/security/errors";

export class ImageGenerator {
  private static providers: Map<string, ImageProvider> = new Map();

  public static initialize() {
    this.providers.set("google", new GeminiImageProvider());
    this.providers.set("huggingface", new HuggingFaceImageProvider());
  }

  public static async generate(
    request: ImageGenerationRequest,
    preferredProvider = "google"
  ): Promise<ImageGenerationResponse> {
    if (this.providers.size === 0) {
      this.initialize();
    }

    const gemini = this.providers.get("google") as GeminiImageProvider;
    const huggingface = this.providers.get("huggingface") as HuggingFaceImageProvider;

    // 1. Primary: Try Gemini image generation if configured
    if (preferredProvider === "google" && gemini && gemini.isConfigured()) {
      try {
        const geminiResult = await gemini.generateImage(request);
        if (geminiResult.success && geminiResult.image?.data) {
          return geminiResult;
        }
      } catch (err: any) {
        console.warn("Gemini image provider error, evaluating FLUX fallback:", err?.message || err);

        // Check if error is a quota/billing/availability failure
        const isQuotaOrAvailability =
          err?.code === "IMAGE_PROVIDER_QUOTA" ||
          err?.statusCode === 429 ||
          err?.statusCode === 503 ||
          (err?.message &&
            (err.message.includes("Quota exceeded") ||
              err.message.includes("limit: 0") ||
              err.message.includes("unavailable")));

        if (!isQuotaOrAvailability) {
          // Re-throw programming, authentication, or validation errors
          throw err;
        }
      }
    }

    // 2. Fallback: Try Hugging Face FLUX.1-schnell model
    if (huggingface && huggingface.isConfigured()) {
      try {
        console.log("Routing image generation request to Hugging Face FLUX.1-schnell fallback...");
        return await huggingface.generateImage(request);
      } catch (hfErr: any) {
        console.error("Hugging Face FLUX image generation fallback error:", hfErr);
        if (hfErr instanceof AppError) throw hfErr;
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: hfErr?.message || "Hugging Face FLUX image generation failed.",
          statusCode: 500,
        });
      }
    }

    // 3. Both Providers Unconfigured or Quota Exhausted
    throw new AppError({
      code: "IMAGE_PROVIDER_QUOTA",
      message: "Image generation is currently unavailable.",
      statusCode: 429,
    });
  }
}
