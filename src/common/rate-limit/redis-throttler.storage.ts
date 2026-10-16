import { type ThrottlerStorage } from "@nestjs/throttler";

import { throttlerStorageKey } from "../redis/cache-key";
import { RedisService } from "../redis/redis.service";

export class RedisThrottlerStorage implements ThrottlerStorage {
    constructor(private readonly redis: RedisService) {}

    async increment(
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        throttlerName: string
    ) {
        const storageKey = throttlerStorageKey(throttlerName, key);

        return this.redis.incrementRateLimit(
            storageKey,
            ttl,
            limit,
            blockDuration
        );
    }
}
