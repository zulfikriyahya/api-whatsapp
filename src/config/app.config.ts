import { z } from "zod";

const envSchema = z.object({
  MARIADB_HOST: z.string().min(1),
  MARIADB_PORT: z.string().regex(/^\d+$/),
  MARIADB_USER: z.string().min(1),
  MARIADB_PASSWORD: z.string(),
  MARIADB_DATABASE: z.string().min(1),

  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  WHATSAPP_SESSION_PATH: z.string().default("./sessions"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  RATE_LIMIT_PER_MINUTE: z.string().regex(/^\d+$/).default("20"),
  RATE_LIMIT_PER_HOUR: z.string().regex(/^\d+$/).default("500"),
  RATE_LIMIT_PER_DAY: z.string().regex(/^\d+$/).default("10000"),

  MAX_RETRY_ATTEMPTS: z.string().regex(/^\d+$/).default("3"),
  RETRY_DELAY_MS: z.string().regex(/^\d+$/).default("5000"),

  CRON_SECRET: z.string().min(16),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  ENABLE_AUDIT_LOGS: z
    .string()
    .regex(/^(true|false)$/)
    .default("true"),

  MAX_UPLOAD_SIZE_MB: z.string().regex(/^\d+$/).default("16"),
  STORAGE_CLEANUP_DAYS: z.string().regex(/^\d+$/).default("30"),

  WEBHOOK_TIMEOUT_MS: z.string().regex(/^\d+$/).default("10000"),
  WEBHOOK_MAX_RETRIES: z.string().regex(/^\d+$/).default("3"),

  SESSION_TIMEOUT_MS: z.string().regex(/^\d+$/).default("1800000"),
  DB_CONNECTION_LIMIT: z.string().regex(/^\d+$/).default("20"),
  DB_IDLE_TIMEOUT_MS: z.string().regex(/^\d+$/).default("60000"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).optional(),
  SMTP_SECURE: z
    .string()
    .regex(/^(true|false)$/)
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),

  SENTRY_DSN: z.string().url().optional(),
  ENABLE_SENTRY: z
    .string()
    .regex(/^(true|false)$/)
    .default("false"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  if (typeof window !== "undefined") {
    return process.env as unknown as Env;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${messages?.join(", ")}`)
      .join("\n");

    console.error("\n=== ENVIRONMENT VALIDATION FAILED ===");
    console.error("Missing or invalid environment variables:\n");
    console.error(errorMessages);
    console.error("\n=== REQUIRED VARIABLES ===");
    console.error("Database:");
    console.error("  - MARIADB_HOST");
    console.error("  - MARIADB_PORT");
    console.error("  - MARIADB_USER");
    console.error("  - MARIADB_PASSWORD");
    console.error("  - MARIADB_DATABASE");
    console.error("\nAuthentication:");
    console.error("  - NEXTAUTH_URL (must be valid URL)");
    console.error("  - NEXTAUTH_SECRET (min 32 characters)");
    console.error("  - GOOGLE_CLIENT_ID");
    console.error("  - GOOGLE_CLIENT_SECRET");
    console.error("\nSecurity:");
    console.error("  - CRON_SECRET (min 16 characters)");
    console.error(
      "\nPlease check your .env file and ensure all required variables are set correctly.\n",
    );

    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Environment validation failed in production. Cannot start application.",
      );
    }

    console.warn("⚠️  Continuing with invalid environment in development mode");
    return process.env as unknown as Env;
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
    connectionLimit: parseInt(env.DB_CONNECTION_LIMIT),
    idleTimeout: parseInt(env.DB_IDLE_TIMEOUT_MS),
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
    sessionTimeout: parseInt(env.SESSION_TIMEOUT_MS),
  },

  rateLimit: {
    perMinute: parseInt(env.RATE_LIMIT_PER_MINUTE),
    perHour: parseInt(env.RATE_LIMIT_PER_HOUR),
    perDay: parseInt(env.RATE_LIMIT_PER_DAY),
  },

  retry: {
    maxAttempts: parseInt(env.MAX_RETRY_ATTEMPTS),
    delayMs: parseInt(env.RETRY_DELAY_MS),
  },

  storage: {
    maxUploadSizeMB: parseInt(env.MAX_UPLOAD_SIZE_MB),
    cleanupDays: parseInt(env.STORAGE_CLEANUP_DAYS),
  },

  webhook: {
    timeoutMs: parseInt(env.WEBHOOK_TIMEOUT_MS),
    maxRetries: parseInt(env.WEBHOOK_MAX_RETRIES),
  },

  logging: {
    level: env.LOG_LEVEL,
    enableAudit: env.ENABLE_AUDIT_LOGS === "true",
  },

  smtp: env.SMTP_HOST
    ? {
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT || "587"),
        secure: env.SMTP_SECURE === "true",
        auth: {
          user: env.SMTP_USER || "",
          pass: env.SMTP_PASS || "",
        },
        from: env.SMTP_FROM || "",
      }
    : undefined,

  redis: env.REDIS_URL
    ? {
        url: env.REDIS_URL,
        password: env.REDIS_PASSWORD,
      }
    : undefined,

  sentry:
    env.SENTRY_DSN && env.ENABLE_SENTRY === "true"
      ? {
          dsn: env.SENTRY_DSN,
          environment: env.NODE_ENV,
        }
      : undefined,

  cronSecret: env.CRON_SECRET,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
} as const;

export function getConfig<K extends keyof typeof appConfig>(
  key: K,
): (typeof appConfig)[K] {
  return appConfig[key];
}

export function isFeatureEnabled(feature: string): boolean {
  const featureFlags: Record<string, boolean> = {
    auditLogs: appConfig.logging.enableAudit,
    redis: !!appConfig.redis,
    smtp: !!appConfig.smtp,
    sentry: !!appConfig.sentry,
  };

  return featureFlags[feature] ?? false;
}

export function validateProductionConfig(): void {
  if (!appConfig.isProduction) return;

  const requiredInProduction = [
    { key: "CRON_SECRET", value: env.CRON_SECRET },
    { key: "NEXTAUTH_SECRET", value: env.NEXTAUTH_SECRET },
  ];

  const missing = requiredInProduction.filter(
    ({ value }) => !value || value.length < 16,
  );

  if (missing.length > 0) {
    throw new Error(
      `Production configuration error: ${missing.map((m) => m.key).join(", ")} must be properly configured`,
    );
  }

  console.log("✅ Production configuration validated successfully");
}

if (appConfig.isProduction) {
  validateProductionConfig();
}
