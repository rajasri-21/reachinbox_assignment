const REQUIRED_VARS = [
  "DATABASE_URL",
  "REDIS_URL",
  "ELASTICSEARCH_URL",
  "FRONTEND_URL",
  "BACKEND_URL",
  "GOOGLE_CLIENT_ID",
  "SESSION_SECRET",
  "SLACK_CLIENT_ID",
  "SLACK_CLIENT_SECRET",
  "SLACK_REDIRECT_URI",
  "SLACK_TOKEN_ENCRYPTION_KEY",
] as const;

function readEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const backendUrl = new URL(process.env.BACKEND_URL!);
  const port = Number(process.env.PORT ?? backendUrl.port ?? 3000);

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL!,
    ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    BACKEND_URL: process.env.BACKEND_URL!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID!,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET!,
    SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI!,
    SLACK_TOKEN_ENCRYPTION_KEY: process.env.SLACK_TOKEN_ENCRYPTION_KEY!,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: port,
  };
}

export const env = readEnv();
export type Env = typeof env;
