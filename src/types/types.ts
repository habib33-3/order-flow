import { UserRole } from "src/generated/prisma/enums";

export type JwtPayload = {
    sub: string;
    email: string;
    role: UserRole;
};

export type RefreshTokenPayload = {
    sub: string;

    type: "REFRESH_TOKEN";
};
