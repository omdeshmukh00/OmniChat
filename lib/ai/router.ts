import { AIProvider } from "./provider";
import { providerRegistry } from "./registry";
import { AIRequest } from "./types";

export type MessageIntent =
  | "NORMAL_CHAT"
  | "IMAGE_GENERATION"
  | "VISION"
  | "FILE_ANALYSIS"
  | "WEB_SEARCH";

export class AutoRouter {
  public static classifyIntent(
    prompt: string,
    mode?: string,
    attachments: any[] = []
  ): MessageIntent {
    // 1. Explicit Mode Overrides
    if (mode === "image" || mode?.startsWith("image_")) return "IMAGE_GENERATION";
    if (mode === "search" || mode === "web_search") return "WEB_SEARCH";

    const lower = prompt.toLowerCase().trim();

    // 2. Questions ABOUT images exemption (must remain NORMAL_CHAT)
    const isImageQuestion =
      lower.startsWith("what is an image") ||
      lower.startsWith("how does image generation work") ||
      lower.startsWith("how to convert image") ||
      lower.startsWith("supported image formats") ||
      lower.startsWith("explain image") ||
      lower.startsWith("what is jpeg") ||
      lower.startsWith("what is png") ||
      lower.startsWith("why are images");

    if (!isImageQuestion) {
      // 3. Semantic Image Generation Regex / Keyword Matching (checking anywhere in prompt)
      const imageGenPatterns = [
        /generate\s+(an?\s+)?image/i,
        /create\s+(an?\s+)?image/i,
        /generate\s+(an?\s+)?picture/i,
        /create\s+(an?\s+)?picture/i,
        /generate\s+(an?\s+)?photo/i,
        /create\s+(an?\s+)?photo/i,
        /make\s+(an?\s+)?illustration/i,
        /create\s+(an?\s+)?illustration/i,
        /make\s+(a\s+)?poster/i,
        /create\s+(a\s+)?poster/i,
        /make\s+(a\s+)?wallpaper/i,
        /create\s+(a\s+)?wallpaper/i,
        /generate\s+(a\s+)?wallpaper/i,
        /draw\s+(a\s+)?/i,
        /render\s+(an?\s+)?image/i,
        /create\s+a\s+photorealistic/i,
        /generate\s+a\s+photorealistic/i,
        /cinematic\s+image/i,
        /infographic/i,
      ];

      const matchesImageGen = imageGenPatterns.some((pattern) => pattern.test(lower));
      if (matchesImageGen) {
        return "IMAGE_GENERATION";
      }
    }

    // 4. Attachments intent
    if (attachments && attachments.length > 0) {
      const hasImage = attachments.some(
        (a) => (a.mimeType && a.mimeType.startsWith("image/")) || (a.name && /\.(png|jpg|jpeg|webp)$/i.test(a.name))
      );
      if (hasImage) {
        return "VISION";
      }
      return "FILE_ANALYSIS";
    }

    // 5. Automatic Current Information / Web Search Signals
    const webSearchPatterns = [
      /who\s+is/i,
      /what\s+is\s+the\s+(current|latest|today'?s|present|live)/i,
      /current\s+(chief\s+minister|prime\s+minister|president|governor|ceo|leader|collector|stock|price|news|weather|rate|market)/i,
      /stock\s+price/i,
      /share\s+price/i,
      /price\s+of/i,
      /current\s+price/i,
      /latest\s+price/i,
      /market\s+cap/i,
      /trading\s+at/i,
      /ticker/i,
      /\b(nse|bse|nifty|sensex)\b/i,
      /latest\s+news/i,
      /today'?s\s+news/i,
      /weather/i,
      /who\s+won/i,
      /latest\s+version/i,
      /real-time/i,
      /live\s+score/i,
      /score\s+of/i,
      /crypto\s+price/i,
      /exchange\s+rate/i,
      /who\s+is\s+the\s+cm\s+of/i,
      /who\s+is\s+cm\s+of/i,
      /chief\s+minister\s+of/i,
      /collector\s+of/i,
    ];
    if (webSearchPatterns.some((p) => p.test(lower))) {
      return "WEB_SEARCH";
    }

    return "NORMAL_CHAT";
  }

  public static selectProviderAndModel(request: AIRequest): {
    provider: AIProvider;
    model: string;
  } {
    // 1. Direct Model Selection
    if (request.model && request.model !== "auto") {
      const allProviders = providerRegistry.getAllProviders();
      for (const provider of allProviders) {
        if (provider.id === request.provider) {
          return { provider, model: request.model };
        }
      }

      // Match model ID prefix/name
      if (request.model.startsWith("gpt") || request.model.startsWith("o3")) {
        return { provider: providerRegistry.getProvider("openai"), model: request.model };
      }
      if (request.model.startsWith("gemini")) {
        return { provider: providerRegistry.getProvider("gemini"), model: request.model };
      }
      if (request.model.startsWith("claude")) {
        return { provider: providerRegistry.getProvider("anthropic"), model: request.model };
      }
      if (request.model.startsWith("grok")) {
        return { provider: providerRegistry.getProvider("xai"), model: request.model };
      }
    }

    // 2. Direct Provider Selection
    if (request.provider && request.provider !== "auto") {
      const provider = providerRegistry.getProvider(request.provider);
      const defaultModel =
        request.model ||
        (request.provider === "gemini"
          ? "gemini-3.5-flash"
          : request.provider === "openai"
          ? "gpt-4o"
          : request.provider === "anthropic"
          ? "claude-3-5-sonnet-20241022"
          : "grok-2-latest");
      return { provider, model: defaultModel };
    }

    // 3. Capability-based Auto-Routing
    const configured = providerRegistry.getConfiguredProviders();
    const geminiProvider = configured.find((p) => p.id === "gemini");
    const openaiProvider = configured.find((p) => p.id === "openai");
    const activeProvider = geminiProvider || openaiProvider || configured[0] || providerRegistry.getProvider("gemini");

    if (request.mode === "image" || request.mode?.startsWith("image_")) {
      const imgProvider = configured.find((p) => p.capabilities.imageGeneration) || providerRegistry.getProvider("openai");
      return { provider: imgProvider, model: "dall-e-3" };
    }

    if (request.attachments && request.attachments.length > 0) {
      const hasImage = request.attachments.some((a) => a.mimeType && a.mimeType.startsWith("image/"));
      if (hasImage) {
        return { provider: activeProvider, model: activeProvider.id === "openai" ? "gpt-4o" : "gemini-3.5-flash" };
      }
    }

    // Default Auto Model (OpenAI GPT-4o / Gemini 3.5 Flash)
    const defaultModel =
      activeProvider.id === "openai"
        ? "gpt-4o"
        : activeProvider.id === "gemini"
        ? "gemini-3.5-flash"
        : "gpt-4o";

    return { provider: activeProvider, model: defaultModel };
  }
}
