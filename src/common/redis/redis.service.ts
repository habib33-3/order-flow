import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";

import Redis from "ioredis";

import { env } from "../env/env";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);

    private readonly redis = new Redis(env.REDIS_URL);

    onModuleInit(): void {
        this.redis.on("connect", () => {
            this.logger.log("Redis connected");
        });

        this.redis.on("error", (error) => {
            this.logger.error("Redis error", error);
        });
    }

    async onModuleDestroy(): Promise<void> {
        await this.redis.quit();

        this.logger.log("Redis disconnected");
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.redis.set(key, value, "EX", ttl);
            return;
        }

        await this.redis.set(key, value);
    }

    async get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    async delete(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async exists(key: string): Promise<boolean> {
        return (await this.redis.exists(key)) === 1;
    }
}
