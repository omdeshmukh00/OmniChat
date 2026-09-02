import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getServerEnv } from "@/lib/security/env";
import { providerRegistry } from "@/lib/ai/registry";

export async function GET() {
  const env = getServerEnv();
  const db = await connectToDatabase();
  const configuredProviders = providerRegistry.getConfiguredProviders();

  return NextResponse.json({
    status: "ok",
    app: "OmniChat",
    database: {
      connected: Boolean(db && db.connection.readyState === 1),
      state: db ? db.connection.readyState : 0, // 0 = disconnected, 1 = connected
    },
    providers: {
      total: providerRegistry.getAllProviders().length,
      configured: configuredProviders.map((p) => p.id),
      defaultProvider: env.DEFAULT_PROVIDER,
      defaultModel: env.DEFAULT_MODEL,
    },
    timestamp: new Date().toISOString(),
  });
}
