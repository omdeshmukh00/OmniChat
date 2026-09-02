const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{20,}/g,
  /key-[a-zA-Z0-9_-]{20,}/g,
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /mongodb(?:\+srv)?:\/\/[^\s]+/gi,
];

function redactSensitiveInfo(message: string): string {
  let redacted = message;
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}

export const logger = {
  info: (message: string, ...meta: unknown[]) => {
    console.log(`[INFO] ${redactSensitiveInfo(message)}`, ...meta);
  },
  warn: (message: string, ...meta: unknown[]) => {
    console.warn(`[WARN] ${redactSensitiveInfo(message)}`, ...meta);
  },
  error: (message: string, ...meta: unknown[]) => {
    console.error(`[ERROR] ${redactSensitiveInfo(message)}`, ...meta);
  },
};
