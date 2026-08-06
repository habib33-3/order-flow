import { env } from "../env/env";

const withPrefix = (...parts: string[]) =>
    `${env.APP_NAME}-cache:${parts.join(":")}`;

// auth keys
export const otpKeyWithEmail = (email: string) =>
    withPrefix("auth", "otp", "email", email);

export const refreshKeyWithUserId = (userId: string) =>
    withPrefix("auth", "refresh", "id", userId);

export const otpResendKey = (email: string) =>
    withPrefix("auth", "otp", "resend", email);

export const forgotPasswordOtpKey = (email: string) =>
    withPrefix("auth", "forgot-password", "otp", email);

export const forgotPasswordOtpResendKey = (email: string) =>
    withPrefix("auth", "forgot-password", "otp", "resend", email);

export const passwordResetTokenKey = (email: string) =>
    withPrefix("auth", "password-reset", "token", email);

// user keys
export const userCacheKeyWithEmail = (email: string) =>
    withPrefix("user", "email", email);

export const userCacheKeyWithId = (id: string) => withPrefix("user", "id", id);

// Shipping Address Keys

export const shippingAddressCacheKeyWithUserId = (userId: string) =>
    withPrefix("shipping-address", "userId", userId);

export const shippingAddressCacheKeyWithId = (id: string) =>
    withPrefix("shipping-address", "id", id);
