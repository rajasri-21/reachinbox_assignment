function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer (got ${raw})`);
  }
  return parsed;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const env = {
  get DATABASE_URL() {
    return requireEnv("DATABASE_URL");
  },
  get REDIS_URL() {
    return requireEnv("REDIS_URL");
  },
  get ELASTICSEARCH_URL() {
    return requireEnv("ELASTICSEARCH_URL");
  },
  get SLACK_TOKEN_ENCRYPTION_KEY() {
    return requireEnv("SLACK_TOKEN_ENCRYPTION_KEY");
  },
  get ETHEREAL_HOST() {
    return process.env.ETHEREAL_HOST ?? "smtp.ethereal.email";
  },
  get ETHEREAL_PORT() {
    return parseIntEnv("ETHEREAL_PORT", 587);
  },
  get ETHEREAL_USER() {
    return requireEnv("ETHEREAL_USER");
  },
  get ETHEREAL_PASS() {
    return requireEnv("ETHEREAL_PASS");
  },
  get WORKER_CONCURRENCY() {
    return parseIntEnv("WORKER_CONCURRENCY", 5);
  },
  get MIN_SEND_DELAY_MS() {
    return parseIntEnv("MIN_SEND_DELAY_MS", 2000);
  },
  get MAX_EMAILS_PER_HOUR() {
    const fallback = 200;
    const raw = process.env.MAX_EMAILS_PER_HOUR;
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error(`MAX_EMAILS_PER_HOUR must be a positive integer (got ${raw})`);
    }
    return parsed;
  },
};
