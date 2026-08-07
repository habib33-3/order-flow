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

        this.redis.on("ready", () => {
            this.logger.log("Redis ready");
        });

        this.redis.on("error", (error) => {
            this.logger.error("Redis error", error.stack);
        });

        this.redis.on("close", () => {
            this.logger.warn("Redis connection closed");
        });

        this.redis.on("reconnecting", () => {
            this.logger.warn("Redis reconnecting...");
        });

        this.redis.on("end", () => {
            this.logger.warn("Redis connection ended");
        });
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.redis.quit();
            this.logger.log("Redis disconnected");
        } catch (error) {
            this.logger.error(
                "Failed to disconnect Redis",
                error instanceof Error ? error.stack : String(error)
            );
        }
    }

    async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
        try {
            await this.redis.set(key, JSON.stringify(value), "EX", ttl);
        } catch (error) {
            this.handleError("SET", key, error);
        }
    }

    async setIfNotExists<T>(
        key: string,
        value: T,
        ttl = 3600
    ): Promise<boolean> {
        try {
            const result = await this.redis.set(
                key,
                JSON.stringify(value),
                "EX",
                ttl,
                "NX"
            );

            return result === "OK";
        } catch (error) {
            this.handleError("SET NX", key, error);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);

            if (value === null) {
                return null;
            }

            return this.reviveDates(JSON.parse(value) as T);
        } catch (error) {
            this.handleError("GET", key, error);
        }
    }

    async delete(key: string): Promise<boolean> {
        try {
            return (await this.redis.del(key)) > 0;
        } catch (error) {
            this.handleError("DEL", key, error);
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            return (await this.redis.exists(key)) === 1;
        } catch (error) {
            this.handleError("EXISTS", key, error);
        }
    }

    async ttl(key: string): Promise<number> {
        try {
            return await this.redis.ttl(key);
        } catch (error) {
            this.handleError("TTL", key, error);
        }
    }

    private handleError(operation: string, key: string, error: unknown): never {
        this.logger.error(
            `Redis ${operation} failed for key "${key}"`,
            error instanceof Error ? error.stack : String(error)
        );

        throw error;
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
}
