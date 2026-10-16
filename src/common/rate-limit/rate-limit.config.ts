export const RateLimitPolicy = {
    AUTH: "AUTH",
    OTP: "OTP",
    PASSWORD_RESET: "PASSWORD_RESET",
    PAYMENT_INITIATION: "PAYMENT_INITIATION",
    PAYMENT_VERIFICATION: "PAYMENT_VERIFICATION",
    LLM: "LLM",
    EXEMPT: "EXEMPT",
} as const;

export type RateLimitPolicy =
    (typeof RateLimitPolicy)[keyof typeof RateLimitPolicy];

export type ConfiguredRateLimitPolicy = Exclude<
    RateLimitPolicy,
    typeof RateLimitPolicy.EXEMPT
>;

export const RATE_LIMIT_ACCOUNT_SCOPE_KEY = "rate-limit:account-scope";

export type RateLimitOptions = {
    limit: number;
    ttl: number;
};

export const ACCOUNT_SCOPED_RATE_LIMIT_POLICIES: ReadonlySet<ConfiguredRateLimitPolicy> =
    new Set([
        RateLimitPolicy.AUTH,
        RateLimitPolicy.OTP,
        RateLimitPolicy.PASSWORD_RESET,
    ]);

export const DEFAULT_RATE_LIMIT: RateLimitOptions = {
    limit: 100,
    ttl: 60_000,
};

export const RATE_LIMIT_POLICIES: Record<
    ConfiguredRateLimitPolicy,
    RateLimitOptions
> = {
    AUTH: {
        limit: 5,
        ttl: 60_000,
    },
    OTP: {
        limit: 3,
        ttl: 300_000,
    },
    PASSWORD_RESET: {
        limit: 3,
        ttl: 300_000,
    },
    PAYMENT_INITIATION: {
        limit: 5,
        ttl: 60_000,
    },
    PAYMENT_VERIFICATION: {
        limit: 10,
        ttl: 60_000,
    },
    LLM: {
        limit: 5,
        ttl: 60_000,
    },
};
