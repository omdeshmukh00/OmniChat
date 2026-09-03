import mongoose from "mongoose";
import { getServerEnv } from "@/lib/security/env";
import { logger } from "@/lib/security/logger";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const env = getServerEnv();
  const uri = env.MONGODB_URI;

  if (!uri || uri.trim() === "") {
    logger.warn("MONGODB_URI is not set. Database operations will operate in unconfigured state.");
    return null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: "omnichat",
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        logger.info("MongoDB connected successfully with connection pooling.");
        return m;
      })
      .catch((err) => {
        logger.error("MongoDB connection failed gracefully:", err.message);
        cached.promise = null;
        return null;
      });
  }

  try {
    const res = await cached.promise;
    if (!res || mongoose.connection.readyState !== 1) {
      cached.promise = null;
      cached.conn = null;
      return null;
    }
    cached.conn = res;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    logger.error("Error awaiting MongoDB connection promise:", err);
    return null;
  }

  return cached.conn;
}
