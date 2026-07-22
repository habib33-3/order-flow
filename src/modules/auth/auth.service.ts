import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";

import * as argon from "argon2";
import { PrismaService } from "src/common/prisma/prisma.service";

import { LoginUserDto } from "./dto/login.dto";
import { RegisterUserDto } from "./dto/registration.dto";

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async registerUser(payload: RegisterUserDto) {
        const isUserExists = await this.prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });

        if (isUserExists) {
            throw new BadRequestException("User already exists");
        }

        const hashedPassword = await argon.hash(payload.password);
        return this.prisma.user.create({
            data: {
                email: payload.email,
                password: hashedPassword,
                name: payload.name,
            },
        });
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

        const isPasswordValid = await argon.verify(
            user.password,
            payload.password
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return user;
    }
}
