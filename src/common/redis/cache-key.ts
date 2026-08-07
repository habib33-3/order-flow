import { ProductStatus } from "src/generated/prisma/enums";

import { env } from "../env/env";

const withPrefix = (...parts: (string | number | undefined | null)[]) =>
    `${env.APP_NAME}-cache:${parts
        .filter((part) => part !== undefined && part !== null && part !== "")
        .join(":")}`;

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

export const shippingAddressCacheKeyWithUserId = (
    userId: string,
    search = ""
) => withPrefix("shipping-address", "userId", userId, search);

export const shippingAddressCacheKeyWithId = (id: string, userId: string) =>
    withPrefix("shipping-address", "id", id, userId);

// products

export const productCacheKeyWithId = (id: string) =>
    withPrefix("product", "id", id);

export const productListCacheKey = (
    search = "",
    cursorId?: string,
    limit = 20,
    filter?: {
        status?: ProductStatus;
    },
    sort: "asc" | "desc" = "desc",
    sortBy: "price" | "stock" | "name" | "createdAt" = "createdAt"
) => {
    return withPrefix(
        "product",
        "list",
        search,
        cursorId,
        limit,
        filter?.status,
        sort,
        sortBy
    );
};

// category
export const categoryCacheKeyWithId = (id: string) =>
    withPrefix("category", "id", id);

export const categoryListCacheKey = (search?: string) =>
    withPrefix("category", "list", search);
