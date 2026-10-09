import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "src/common/env/env";
import { UserService } from "src/modules/user/user.service";
import { JwtPayload } from "src/types/types";

import { AuthService } from "../auth.service";
import { ACCESS_TOKEN } from "../constants/auth.constants";

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
    Strategy,
    ACCESS_TOKEN
) {
    constructor(
        private readonly auth: AuthService,
        private readonly userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: env.ACCESS_TOKEN_SECRET,
            algorithms: ["HS256"],
            ignoreExpiration: false,
        });
    }

    async validate(payload: JwtPayload): Promise<JwtPayload> {
        if (!payload) {
            throw new UnauthorizedException("Invalid token");
        }

        const user = await this.userService.getUserById(payload.sub);

        if (!user) {
            throw new UnauthorizedException("Invalid token");
        }

        if (user.status !== "ACTIVE") {
            throw new UnauthorizedException("User is not active");
        }

        if (payload.role !== user.role) {
            throw new UnauthorizedException("Invalid token");
        }

        return payload;
    }
}
