import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "src/common/env/env";
import { refreshKeyWithJti } from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
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
        private readonly redis: RedisService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: env.REFRESH_TOKEN_SECRET,
            algorithms: ["HS256"],
            ignoreExpiration: false,
        });
    }

    async validate(payload: RefreshTokenPayload) {
        if (payload.type !== "REFRESH_TOKEN") {
            throw new UnauthorizedException("Invalid token type");
        }

        const userId = await this.redis.get<string>(
            refreshKeyWithJti(payload.jti)
        );

        if (!userId || userId !== payload.sub) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        const user = await this.auth.getUserById(payload.sub);

        if (!user) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        if (user.status !== "ACTIVE") {
            throw new UnauthorizedException("User is not active");
        }

        return {
            userId: user.id,
            refreshTokenId: payload.jti,
        };
    }
}
