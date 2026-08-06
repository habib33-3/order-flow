import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    userCacheKeyWithEmail,
    userCacheKeyWithId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { UploadFileService } from "src/common/upload-file/upload-file.service";
import { User } from "src/generated/prisma/client";

import { UpdateUserProfileDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly upload: UploadFileService
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

    async updateUserProfile(userId: string, payload: UpdateUserProfileDto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: payload,
            omit: {
                password: true,
            },
        });

        await Promise.all([
            this.redis.delete(userCacheKeyWithId(userId)),
            this.redis.delete(userCacheKeyWithEmail(user.email)),
        ]);

        return user;
    }

    async changeAvatar(image: Express.Multer.File, userId: string) {
        if (!image) {
            throw new BadRequestException("Image is required");
        }

        const result = await this.upload.uploadFile(image, "avatars");

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                avatarUrl: result.url,
            },
            omit: {
                password: true,
            },
        });

        await Promise.all([
            this.redis.delete(userCacheKeyWithId(userId)),
            this.redis.delete(userCacheKeyWithEmail(user.email)),
        ]);

        return user;
    }
}
