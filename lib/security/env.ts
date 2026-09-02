import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().optional().default("mongodb://localhost:27017/omnichat"),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  COHERE_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  FIREWORKS_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional(),
  MAX_FILE_SIZE_MB: z.coerce.number().default(20),
  MAX_FILES_PER_MESSAGE: z.coerce.number().default(10),
  MAX_EXTRACTED_TEXT_CHARS: z.coerce.number().default(200000),
  MAX_AUDIO_SIZE_MB: z.coerce.number().default(25),
  DEFAULT_PROVIDER: z.string().default("auto"),
  DEFAULT_MODEL: z.string().default("auto"),
});

export type ServerEnv = z.infer<typeof envSchema>;

let parsedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY VIOLATION: Attempted to access server environment from client component.");
  }
  if (!parsedEnv) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error("Invalid environment configuration:", result.error.format());
      // Return defaults instead of crashing if optional keys are unconfigured
      parsedEnv = envSchema.parse({});
    } else {
      parsedEnv = result.data;
    }
  }
  return parsedEnv;
}
