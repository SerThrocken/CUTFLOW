import { z } from "zod";

const webEnvSchema = z.object({
	// Node
	NODE_ENV: z.enum(["development", "production", "test"]),
	ANALYZE: z.string().optional(),
	NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),

	// Public
	NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
	NEXT_PUBLIC_MARBLE_API_URL: z.url().default("https://api.marblecms.com"),

	// Server
	DATABASE_URL: z.string().default("postgresql://localhost:5432/dummy").refine(
		(url) =>
			url.startsWith("postgres://") || url.startsWith("postgresql://"),
		"DATABASE_URL must be a postgres:// or postgresql:// URL",
	),

	BETTER_AUTH_SECRET: z.string().default("dummy-secret-at-least-32-chars-long-123456"),
	UPSTASH_REDIS_REST_URL: z.url().default("https://dummy.upstash.io"),
	UPSTASH_REDIS_REST_TOKEN: z.string().default("dummy-token"),
	MARBLE_WORKSPACE_KEY: z.string().default("dummy-workspace"),
	FREESOUND_CLIENT_ID: z.string().default("dummy-client-id"),
	FREESOUND_API_KEY: z.string().default("dummy-api-key"),
	SUPABASE_URL: z.string().optional(),
	SUPABASE_KEY: z.string().optional(),
	DISCORD_WEBHOOK_URL: z.string().optional(),
	PAYPAL_WEBHOOK_SECRET: z.string().optional(),
	PATREON_WEBHOOK_SECRET: z.string().optional(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const webEnv = webEnvSchema.parse(process.env);
