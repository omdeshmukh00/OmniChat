import { HfInference } from "@huggingface/inference";
import { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from "../types";
import { getServerEnv } from "@/lib/security/env";
import { AppError } from "@/lib/security/errors";

export class HuggingFaceImageProvider implements ImageProvider {
  public readonly id = "huggingface";
  public readonly name = "Hugging Face";
  public readonly defaultModel = "black-forest-labs/FLUX.1-schnell";

  public isConfigured(): boolean {
    const env = getServerEnv();
    return Boolean(env.HF_TOKEN && env.HF_TOKEN.trim().length > 0);
  }

  public async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.isConfigured()) {
      throw new AppError({
        code: "UNCONFIGURED_PROVIDER",
        message: "Hugging Face API token (HF_TOKEN) is not configured.",
        statusCode: 400,
      });
    }

    const env = getServerEnv();
    const hfToken = env.HF_TOKEN;
    const model = this.defaultModel;
    const promptText = request.prompt.trim();

    // Map aspect ratio to pixel dimensions
    const ratio = request.aspectRatio || "1:1";
    let width = 1024;
    let height = 1024;

    if (ratio === "16:9") {
      width = 1344;
      height = 768;
    } else if (ratio === "9:16") {
      width = 768;
      height = 1344;
    } else if (ratio === "4:3") {
      width = 1152;
      height = 864;
    } else if (ratio === "3:4") {
      width = 864;
      height = 1152;
    }

    try {
      const hf = new HfInference(hfToken);
      const blob = await hf.textToImage({
        model,
        inputs: promptText,
        parameters: {
          num_inference_steps: 4,
          width,
          height,
        },
      });

      let base64Data = "";
      let mimeType = "image/jpeg";

      if (typeof blob === "string") {
        base64Data = blob.startsWith("data:") ? blob.split(",")[1] : blob;
      } else if (blob && typeof (blob as any).arrayBuffer === "function") {
        mimeType = (blob as any).type || "image/jpeg";
        const arrayBuffer = await (blob as any).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Data = buffer.toString("base64");
      }

      if (!base64Data) {
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: "Hugging Face FLUX model did not return image data.",
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
        aspectRatio: ratio,
        width,
        height,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: err instanceof Error ? err.message : "Hugging Face FLUX image generation failed.",
        statusCode: 500,
      });
    }
  }
}
