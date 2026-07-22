/* eslint-disable no-console */
/* eslint-disable n/prefer-global/process */
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

export const validateEnv = (env: NodeJS.ProcessEnv = process.env) => {
    const parsed = envSchema.safeParse(env);

    if (!parsed.success) {
        console.error("❌ Invalid environment variables:");

        parsed.error.issues.forEach((issue) => {
            const path = issue.path.join(".") || "<root>";
            console.error(`${path}: ${issue.message}`);
        });

        throw new Error("Environment validation failed");
    }

    return Object.freeze(parsed.data);
};
