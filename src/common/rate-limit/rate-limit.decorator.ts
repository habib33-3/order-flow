import { applyDecorators, SetMetadata } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";

import {
    ACCOUNT_SCOPED_RATE_LIMIT_POLICIES,
    RATE_LIMIT_ACCOUNT_SCOPE_KEY,
    RATE_LIMIT_POLICIES,
    RateLimitPolicy,
} from "./rate-limit.config";

export const RateLimit = (policy: RateLimitPolicy): MethodDecorator => {
    if (policy === RateLimitPolicy.EXEMPT) {
        return SkipThrottle();
    }

    const options = RATE_LIMIT_POLICIES[policy];
    const accountScoped = ACCOUNT_SCOPED_RATE_LIMIT_POLICIES.has(policy);
    const throttlers: Record<string, { limit: number; ttl: number }> = {
        default: {
            limit: options.limit,
            ttl: options.ttl,
        },
    };
    if (accountScoped) {
        throttlers.account = {
            limit: options.limit,
            ttl: options.ttl,
        };
    }

    return applyDecorators(
        Throttle(throttlers),
        SetMetadata(RATE_LIMIT_ACCOUNT_SCOPE_KEY, accountScoped)
    );
};
