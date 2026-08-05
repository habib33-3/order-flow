import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import * as argon2 from "argon2";
import { PrismaService } from "src/common/prisma/prisma.service";
import { refreshKeyWithUserId } from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";

import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class PasswordService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService
    ) {}

    async changePassword(payload: ChangePasswordDto, userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                password: true,
                status: true,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const isPasswordValid = await argon2.verify(
            user.password,
            payload.oldPassword
        );

        if (!isPasswordValid) {
            throw new BadRequestException("Old password is incorrect");
        }

        // Prevent changing to the same password
        const isSamePassword = await argon2.verify(
            user.password,
            payload.newPassword
        );

        if (isSamePassword) {
            throw new BadRequestException(
                "New password must be different from the current password"
            );
        }

        const hashedPassword = await argon2.hash(payload.newPassword);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
        });

        await this.redis.delete(refreshKeyWithUserId(user.id));

        return {
            message: "Password changed successfully",
        };
    }
}
