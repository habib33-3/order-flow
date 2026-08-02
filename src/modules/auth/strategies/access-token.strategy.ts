import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "src/common/env/env";
import { JwtPayload } from "src/types/types";

import { AuthService } from "../auth.service";
import { ACCESS_TOKEN } from "../constants/auth.constants";

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
    Strategy,
    ACCESS_TOKEN
) {
    constructor(private readonly auth: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: env.JWT_SECRET,
            algorithms: ["HS256"],
            ignoreExpiration: false,
        });
    }

    async validate(payload: JwtPayload): Promise<JwtPayload> {
        if (!payload) {
            throw new UnauthorizedException("Invalid token");
        }

        const user = await this.auth.getUserById(payload.sub);

        if (!user) {
            throw new UnauthorizedException("Invalid token");
        }

        if (payload.role !== user.role) {
            throw new UnauthorizedException("Invalid token");
        }

        return payload;
    }
}
