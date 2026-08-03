import { env } from "../env/env";

const withPrefix = (...parts: string[]) =>
    `${env.APP_NAME}-cache:${parts.join(":")}`;

// auth keys
export const otpKeyWithEmail = (email: string) =>
    withPrefix("auth", "otp", "email", email);

// user keys
export const userCacheKeyWithEmail = (email: string) =>
    withPrefix("user", "email", email);

export const userCacheKeyWithId = (id: string) => withPrefix("user", "id", id);
