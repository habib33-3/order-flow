/* eslint-disable no-console */
/* eslint-disable n/prefer-global/process */
import "dotenv/config";
import ms from "ms";
import { z } from "zod";

const envSchema = z.object({
    // core
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.coerce.number().default(5000),
    CLIENT_URL: z.url().default("http://localhost:3000"),
    SERVER_URL: z.url(),
    APP_NAME: z.string().default("OrderFlow"),

    // db
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    EMAIL_FROM_EMAIL: z.email(),

    // jwt
    ACCESS_TOKEN_SECRET: z.string(),
    ACCESS_TOKEN_EXPIRES: z
        .string()
        .default("12h")
        .refine(
            (value) => {
                const parsed = ms(value as ms.StringValue);

                return typeof parsed === "number" && parsed > 0;
            },
            {
                message:
                    "ACCESS_TOKEN_EXPIRES must be a positive duration, e.g. 15m, 12h, or 7d",
            }
        )
        .transform((value) => value as ms.StringValue),
    REFRESH_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_EXPIRES: z
        .string()
        .default("7d")
        .refine(
            (value) => {
                const parsed = ms(value as ms.StringValue);

                return typeof parsed === "number" && parsed > 0;
            },
            {
                message:
                    "REFRESH_TOKEN_EXPIRES must be a positive duration, e.g. 15m, 12h, or 7d",
            }
        )
        .transform((value) => value as ms.StringValue),

    PASSWORD_RESET_TOKEN_SECRET: z.string(),

    // stripe
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),

    // bkash
    BKASH_BASE_URL: z.url(),
    BKASH_USERNAME: z.string(),
    BKASH_PASSWORD: z.string(),
    BKASH_APP_KEY: z.string(),
    BKASH_APP_SECRET: z.string(),

    // resend
    RESEND_API_KEY: z.string(),

    // cloudinary
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),

    SHOW_BULL_BOARD: z.coerce.boolean().default(false),
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
