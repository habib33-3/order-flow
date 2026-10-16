import {
    type ThrottlerStorage,
    type ThrottlerStorageRecord,
} from "@nestjs/throttler";

import { RedisService } from "../redis/redis.service";

export class RedisThrottlerStorage implements ThrottlerStorage {
    constructor(private readonly redis: RedisService) {}

    async increment(
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        throttlerName: string
    ): Promise<ThrottlerStorageRecord> {
        const storageKey = `rate-limit:{${throttlerName}:${key}}`;

        return this.redis.incrementRateLimit(
            storageKey,
            ttl,
            limit,
            blockDuration
        );
    }
}
