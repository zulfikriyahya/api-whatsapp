// src/config/app.config.ts
import { z } from "zod";

const envSchema = z.object({
  // Database
  MARIADB_HOST: z.string().default("localhost"),
  MARIADB_PORT: z.string().default("3306"),
  MARIADB_USER: z.string().default("root"),
  MARIADB_PASSWORD: z.string(),
  MARIADB_DATABASE: z.string().default("whatsapp_db"),

  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // WhatsApp
  WHATSAPP_SESSION_PATH: z.string().default("./sessions"),

  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Rate Limiting
  RATE_LIMIT_PER_MINUTE: z.string().default("20"),
  RATE_LIMIT_PER_HOUR: z.string().default("500"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = validateEnv();

// Type-safe config object
export const appConfig = {
  database: {
    host: env.MARIADB_HOST,
    port: parseInt(env.MARIADB_PORT),
    user: env.MARIADB_USER,
    password: env.MARIADB_PASSWORD,
    database: env.MARIADB_DATABASE,
  },
  auth: {
    url: env.NEXTAUTH_URL,
    secret: env.NEXTAUTH_SECRET,
  },
  whatsapp: {
    sessionPath: env.WHATSAPP_SESSION_PATH,
  },
  rateLimit: {
    perMinute: parseInt(env.RATE_LIMIT_PER_MINUTE),
    perHour: parseInt(env.RATE_LIMIT_PER_HOUR),
  },
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
} as const;
