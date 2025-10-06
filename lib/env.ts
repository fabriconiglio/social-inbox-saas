import { z } from "zod"

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),

  // Meta (Facebook & Instagram)
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_VERIFY_TOKEN: z.string().optional(),
  META_WEBHOOK_SECRET: z.string().optional(),

  // WhatsApp Business
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_SECRET: z.string().optional(),

  // TikTok
  TIKTOK_APP_ID: z.string().optional(),
  TIKTOK_APP_SECRET: z.string().optional(),
  TIKTOK_WEBHOOK_SECRET: z.string().optional(),
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),

  // Webhooks (fallback)
  WEBHOOK_SECRET: z.string().optional(),

  // Node env
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Encryption
  ENCRYPTION_MASTER_KEY: z.string().min(32).optional(),
})

export type Env = z.infer<typeof envSchema>

let env: Env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:")
    console.error(error.flatten().fieldErrors)
    throw new Error("Invalid environment variables")
  }
  throw error
}

export { env }
