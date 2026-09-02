declare module "next" {
  export interface NextConfig {
    reactStrictMode?: boolean;
    experimental?: Record<string, unknown>;
    headers?: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
    [key: string]: unknown;
  }
  export type Metadata = Record<string, unknown>;
}

declare module "next/dist/lib/metadata/types/metadata-interface.js" {
  export type ResolvingMetadata = unknown;
  export type ResolvingViewport = unknown;
}
