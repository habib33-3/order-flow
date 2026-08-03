import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import * as argon2 from "argon2";
import { AuthEmailService } from "src/common/email/handler/auth/auth-email.service";
import { env } from "src/common/env/env";
import { PrismaService } from "src/common/prisma/prisma.service";
import {
    userCacheKeyWithEmail,
    userCacheKeyWithId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { User } from "src/generated/prisma/client";
import { JwtPayload } from "src/types/types";

import { LoginUserDto } from "./dto/login.dto";
import { RegisterUserDto } from "./dto/registration.dto";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly redis: RedisService,
        private readonly authMail: AuthEmailService
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

    private async generateAccessToken(payload: JwtPayload) {
        return this.jwtService.signAsync(payload, {
            secret: env.JWT_SECRET,
            expiresIn: env.JWT_EXPIRES,
        });
    }

    async registerUser(payload: RegisterUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });

        if (existingUser) {
            throw new BadRequestException(
                "User with this email already exists"
            );
        }

        const hashedPassword = await argon2.hash(payload.password);

        const user = await this.prisma.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                password: hashedPassword,
            },
        });

        await this.authMail.sentOtpEmail({
            receiverEmail: payload.email,
            receiverName: payload.name,
            otp: 5353,
            expirationMinutes: 10,
        });

        const accessToken = await this.generateAccessToken({
            sub: user.id,
            role: user.role,
            email: user.email,
        });

        return {
            accessToken,
        };
    }

    async login(payload: LoginUserDto) {
        const cacheKey = userCacheKeyWithEmail(payload.email);

        let user = await this.redis.get<User>(cacheKey);

        if (user === null) {
            user = await this.prisma.user.findUnique({
                where: {
                    email: payload.email,
                },
            });

            if (!user) {
                throw new UnauthorizedException("Invalid credentials");
            }

            await this.redis.set(cacheKey, user);
        }

        const isPasswordValid = await argon2.verify(
            user.password,
            payload.password
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const accessToken = await this.generateAccessToken({
            sub: user.id,
            role: user.role,
            email: user.email,
        });

        return {
            accessToken,
        };
    }

    async getCurrentUser(userId: string) {
        const cacheKey = userCacheKeyWithId(userId);

        const cachedUser = await this.redis.get<User>(cacheKey);

        if (cachedUser !== null) {
            return cachedUser;
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            omit: {
                password: true,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        await this.redis.set(cacheKey, user);

        return user;
    }
}
