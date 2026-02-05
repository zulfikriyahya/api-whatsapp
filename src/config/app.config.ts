import { z } from "zod";

const envSchema = z.object({
  MARIADB_HOST: z.string().default("localhost"),
  MARIADB_PORT: z.string().default("3306"),
  MARIADB_USER: z.string().default("root"),
  MARIADB_PASSWORD: z.string().optional().default(""),
  MARIADB_DATABASE: z.string().default("whatsapp_db"),

  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  WHATSAPP_SESSION_PATH: z.string().default("./sessions"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  RATE_LIMIT_PER_MINUTE: z.string().default("20"),
  RATE_LIMIT_PER_HOUR: z.string().default("500"),

  CRON_SECRET: z.string().min(8).default("change_this_secret_in_prod"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  if (typeof window !== "undefined") return process.env as unknown as Env;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "Invalid environment variables:",
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
    );
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

export const env = validateEnv();

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
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  whatsapp: {
    sessionPath: env.WHATSAPP_SESSION_PATH,
  },
  rateLimit: {
    perMinute: parseInt(env.RATE_LIMIT_PER_MINUTE),
    perHour: parseInt(env.RATE_LIMIT_PER_HOUR),
  },
  cronSecret: env.CRON_SECRET,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
} as const;
