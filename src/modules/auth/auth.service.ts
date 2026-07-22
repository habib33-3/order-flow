import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import * as argon2 from "argon2";
import { env } from "src/common/env/env";
import { PrismaService } from "src/common/prisma/prisma.service";
import { JwtPayload } from "src/types/types";

import { LoginUserDto } from "./dto/login.dto";
import { RegisterUserDto } from "./dto/registration.dto";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {}

    async getUserById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
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
        const user = await this.prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });

        if (!user) {
            throw new UnauthorizedException("Invalid credentials");
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

        return user;
    }
}
