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
import { AuthEmailService } from "src/common/email/handler/auth/auth-email.service";
import { env } from "src/common/env/env";
import { PrismaService } from "src/common/prisma/prisma.service";
import {
    forgotPasswordOtpKey,
    forgotPasswordOtpResendKey,
    passwordResetTokenKey,
    refreshKeyWithUserId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";

import { ChangePasswordDto } from "./dto/change-password.dto";
import {
    ForgotPasswordDto,
    ResetPasswordDto,
    VerifyForgotPasswordOtpDto,
} from "./dto/forget-password.dto";

@Injectable()
export class PasswordService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly authMail: AuthEmailService,
        private readonly jwt: JwtService
    ) {}

    private generateOtp(): string {
        return randomInt(100_000, 1_000_000).toString();
    }

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

    async forgotPassword(payload: ForgotPasswordDto) {
        const returnMessage = {
            message:
                "Check your email for the password reset code if the email is registered with us.",
        };

        const user = await this.prisma.user.findUnique({
            where: {
                email: payload.email,
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });

        if (!user) {
            return returnMessage;
        }

        const resendKey = forgotPasswordOtpResendKey(user.email);

        const canResend = await this.redis.setIfNotExists(resendKey, "1", 60);

        if (!canResend) {
            throw new HttpException(
                "You can only request a new password reset code once every 60 seconds. Please wait before trying again.",
                HttpStatus.TOO_MANY_REQUESTS
            );
        }

        const OTP_EXPIRATION_MINUTES = 5;
        const OTP_TTL = OTP_EXPIRATION_MINUTES * 60;

        const otp = this.generateOtp();
        const otpHash = await argon2.hash(otp);

        const otpKey = forgotPasswordOtpKey(user.email);

        try {
            await this.redis.set(otpKey, otpHash, OTP_TTL);

            await this.authMail.sentForgotPasswordOtpEmail({
                receiverEmail: user.email,
                receiverName: user.name ?? user.email,
                otp,
                expirationMinutes: OTP_EXPIRATION_MINUTES,
            });

            return returnMessage;
        } catch (error) {
            await this.redis.delete(otpKey);
            throw error;
        }
    }

    async forgotPasswordVerifyOtp(payload: VerifyForgotPasswordOtpDto) {
        const otpKey = forgotPasswordOtpKey(payload.email);

        const otpHash = await this.redis.get<string>(otpKey);

        if (!otpHash) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        const isOtpValid = await argon2.verify(otpHash, payload.otp);

        if (!isOtpValid) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        await this.redis.delete(otpKey);

        const token = await this.jwt.signAsync(
            {
                email: payload.email,
                type: "PASSWORD_RESET",
            },
            {
                secret: env.PASSWORD_RESET_TOKEN_SECRET,
                expiresIn: "15m",
            }
        );

        await this.redis.set(
            passwordResetTokenKey(payload.email),
            token,
            15 * 60
        );

        return {
            token,
        };
    }

    async resetPassword(payload: ResetPasswordDto) {
        let jwtPayload: { email: string; type: string };

        try {
            jwtPayload = await this.jwt.verifyAsync(payload.token, {
                secret: env.PASSWORD_RESET_TOKEN_SECRET,
            });
        } catch {
            throw new UnauthorizedException(
                "Invalid or expired password reset token"
            );
        }

        if (jwtPayload.type !== "PASSWORD_RESET") {
            throw new UnauthorizedException(
                "Invalid or expired password reset token"
            );
        }

        const email = jwtPayload.email;

        const storedToken = await this.redis.get<string>(
            passwordResetTokenKey(email)
        );

        if (!storedToken || storedToken !== payload.token) {
            throw new UnauthorizedException(
                "Invalid or expired password reset token"
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                password: true,
            },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

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

        await this.redis.delete(passwordResetTokenKey(email));

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
        });

        await this.redis.delete(refreshKeyWithUserId(user.id));

        return {
            message: "Password reset successfully",
        };
    }
}
