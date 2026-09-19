import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import type { Request } from "express";

import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "src/common/env/env";
import { refreshKeyWithUserId } from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { UserService } from "src/modules/user/user.service";
import { RefreshTokenPayload } from "src/types/types";

import { AuthService } from "../auth.service";
import { REFRESH_TOKEN } from "../constants/auth.constants";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    REFRESH_TOKEN
) {
    constructor(
        private readonly auth: AuthService,
        private readonly redis: RedisService,
        private readonly userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: env.REFRESH_TOKEN_SECRET,
            algorithms: ["HS256"],
            ignoreExpiration: false,
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: RefreshTokenPayload) {
        if (payload.type !== "REFRESH_TOKEN") {
            throw new UnauthorizedException("Invalid token type");
        }

        const refreshTokenExists = await this.redis.get<string>(
            refreshKeyWithUserId(payload.sub)
        );

        if (!refreshTokenExists || refreshTokenExists === null) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        const authorizationHeader = req.get("authorization");
        const refreshToken = authorizationHeader?.startsWith("Bearer ")
            ? authorizationHeader.split(" ")[1]
            : undefined;

        if (!refreshToken) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        const user = await this.userService.getUserById(payload.sub);

        if (user.status !== "ACTIVE") {
            throw new UnauthorizedException("User is not active");
        }

        return {
            userId: user.id,
            refreshToken,
        };
    }
}
