import { NextResponse } from "next/server";
import { providerRegistry } from "@/lib/ai/registry";
import { createErrorResponse } from "@/lib/security/errors";

export async function GET() {
  try {
    const models = await providerRegistry.getAllModels();
    const configuredProviders = providerRegistry
      .getConfiguredProviders()
      .map((p) => ({
        id: p.id,
        name: p.name,
        capabilities: p.capabilities,
      }));

    return NextResponse.json({
      providers: configuredProviders,
      models,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
