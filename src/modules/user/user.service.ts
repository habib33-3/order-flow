import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    userCacheKeyWithEmail,
    userCacheKeyWithId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { User } from "src/generated/prisma/client";

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService
    ) {}

    async getUserById(id: string) {
        const cacheKey = userCacheKeyWithId(id);

        const cachedUser = await this.redis.get<User>(cacheKey);

        if (cachedUser !== null) {
            return cachedUser;
        }

        const dbUser = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!dbUser) {
            throw new NotFoundException("User not found");
        }

        await this.redis.set(cacheKey, dbUser);

        return dbUser;
    }

    async getUserByEmail(email: string) {
        const key = userCacheKeyWithEmail(email);

        const cachedUser = await this.redis.get<User>(key);

        if (cachedUser) {
            return cachedUser;
        }

        const user = await this.prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        await this.redis.set(key, user);

        return user;
    }
}
