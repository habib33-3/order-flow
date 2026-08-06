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

    async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
        await this.redis.set(key, JSON.stringify(value), "EX", ttl);
    }

    async setIfNotExists<T>(
        key: string,
        value: T,
        ttl = 3600
    ): Promise<boolean> {
        const result = await this.redis.set(
            key,
            JSON.stringify(value),
            "EX",
            ttl,
            "NX"
        );

        return result === "OK";
    }

    private reviveDates<T>(value: T): T {
        if (typeof value === "string") {
            const date = new Date(value);

            if (!Number.isNaN(date.getTime()) && date.toISOString() === value) {
                return date as T;
            }

            return value;
        }

        if (Array.isArray(value)) {
            return value.map((item) => this.reviveDates(item)) as T;
        }

        if (value !== null && typeof value === "object") {
            return Object.fromEntries(
                Object.entries(value).map(([key, value]) => [
                    key,
                    this.reviveDates(value),
                ])
            ) as T;
        }

        return value;
    }

    async get<T>(key: string): Promise<T | null> {
        const value = await this.redis.get(key);

        if (value === null) {
            return null;
        }

        const parsedValue = JSON.parse(value) as T;

        return this.reviveDates(parsedValue);
    }

    async delete(key: string): Promise<boolean> {
        return (await this.redis.del(key)) > 0;
    }

    async exists(key: string) {
        return (await this.redis.exists(key)) === 1;
    }

    async ttl(key: string): Promise<number> {
        return this.redis.ttl(key);
    }
}
