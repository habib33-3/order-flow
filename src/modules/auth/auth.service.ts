import { randomInt } from "node:crypto";

import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import * as argon2 from "argon2";
import ms from "ms";
import { AuthEmailService } from "src/common/email/handler/auth/auth-email.service";
import { env } from "src/common/env/env";
import { PrismaService } from "src/common/prisma/prisma.service";
import {
    otpKeyWithEmail,
    otpResendKey,
    refreshKeyWithUserId,
    userCacheKeyWithEmail,
    userCacheKeyWithId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { User } from "src/generated/prisma/client";
import { JwtPayload, RefreshTokenPayload } from "src/types/types";

import { UserService } from "../user/user.service";
import { LoginUserDto } from "./dto/login.dto";
import { RegisterUserDto } from "./dto/registration.dto";
import { VerifyOtpEmailDto } from "./dto/verify-otp.dto";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly redis: RedisService,
        private readonly authMail: AuthEmailService,
        private readonly userService: UserService
    ) {}

    private generateOtp(): string {
        return randomInt(1000, 10000).toString();
    }

    private async generateAccessToken(payload: JwtPayload) {
        return this.jwtService.signAsync(payload, {
            secret: env.ACCESS_TOKEN_SECRET,
            expiresIn: env.ACCESS_TOKEN_EXPIRES,
        });
    }

    private async generateRefreshToken(payload: RefreshTokenPayload) {
        return this.jwtService.signAsync(payload, {
            secret: env.REFRESH_TOKEN_SECRET,
            expiresIn: env.REFRESH_TOKEN_EXPIRES,
        });
    }

    private async generateTokens(user: User) {
        const accessToken = await this.generateAccessToken({
            sub: user.id,
            role: user.role,
            email: user.email,
        });

        const refreshToken = await this.generateRefreshToken({
            sub: user.id,
            type: "REFRESH_TOKEN",
        });

        const refreshTokenTtl = ms(env.REFRESH_TOKEN_EXPIRES) / 1000 + 60;

        await this.redis.set(
            refreshKeyWithUserId(user.id),
            refreshToken,
            refreshTokenTtl
        );

        return {
            accessToken,
            refreshToken,
        };
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

        const otp = this.generateOtp();
        const otpHash = await argon2.hash(otp);

        const otpKey = otpKeyWithEmail(payload.email);

        await this.redis.set(otpKey, otpHash, 600);

        await this.authMail.sentOtpEmail({
            receiverEmail: payload.email,
            receiverName: payload.name,
            otp,
            expirationMinutes: 10,
        });

        return {
            message: "Registration successful. Please verify your email.",
            userId: user.id,
        };
    }

    async resendOtp(email: string) {
        const user = await this.userService.getUserByEmail(email);

        if (!user) {
            throw new NotFoundException("User not found");
        }

        if (user.status !== "PENDING") {
            throw new BadRequestException("User is already active");
        }

        const resendKey = otpResendKey(email);

        const canResend = await this.redis.setIfNotExists(resendKey, "1", 60);

        if (!canResend) {
            throw new HttpException(
                "Please wait 60 seconds before requesting another OTP.",
                HttpStatus.TOO_MANY_REQUESTS
            );
        }

        const otpKey = otpKeyWithEmail(email);
        const otp = this.generateOtp();

        try {
            const otpHash = await argon2.hash(otp);

            await this.redis.set(otpKey, otpHash, 600);

            await this.authMail.sentOtpEmail({
                receiverEmail: email,
                receiverName: user.name,
                otp,
                expirationMinutes: 10,
            });

            return {
                message: "OTP resent successfully",
            };
        } catch (error) {
            // Roll back so the user isn't locked out if email delivery fails
            await Promise.all([
                this.redis.delete(resendKey),
                this.redis.delete(otpKey),
            ]);

            throw error;
        }
    }

    async verifyOtp(payload: VerifyOtpEmailDto) {
        const otpKey = otpKeyWithEmail(payload.email);

        const otpHash = await this.redis.get<string>(otpKey);

        if (!otpHash) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        const isOtpValid = await argon2.verify(otpHash, payload.otp);

        if (!isOtpValid) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        const user = await this.userService.getUserByEmail(payload.email);

        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                status: "ACTIVE",
            },
        });

        await Promise.all([
            this.redis.delete(otpKey),
            this.redis.delete(userCacheKeyWithId(user.id)),
            this.redis.delete(userCacheKeyWithEmail(user.email)),
        ]);

        const { accessToken, refreshToken } = await this.generateTokens(user);

        return {
            accessToken,
            refreshToken,
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

        if (user.status !== "ACTIVE") {
            throw new UnauthorizedException("User is not active");
        }

        const isPasswordValid = await argon2.verify(
            user.password,
            payload.password
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const { accessToken, refreshToken } = await this.generateTokens(user);

        return {
            accessToken,
            refreshToken,
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

    async refreshToken(storedRefreshToken: string, userId: string) {
        const user = await this.userService.getUserById(userId);

        if (user.status !== "ACTIVE") {
            throw new UnauthorizedException("User is not active");
        }

        const refreshTokenKey = refreshKeyWithUserId(userId);

        const refreshToken = await this.redis.get<string>(refreshTokenKey);

        if (!refreshToken || refreshToken !== storedRefreshToken) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        await this.redis.delete(refreshTokenKey);

        const { accessToken, refreshToken: newRefreshToken } =
            await this.generateTokens(user);

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    async logout(userId: string) {
        await this.redis.delete(refreshKeyWithUserId(userId));

        return {
            message: "Logged out successfully",
        };
    }
}
