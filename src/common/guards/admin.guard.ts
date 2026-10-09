import { applyDecorators, UseGuards } from "@nestjs/common";

import { UserRole } from "src/generated/prisma/enums";

import { Roles } from "../../modules/auth/auth/decorators/roles.decorator";
import { AccessTokenGuard } from "../../modules/auth/auth/guards/access-token.guard";
import { RolesGuard } from "../../modules/auth/auth/guards/role.guard";

export function AdminGuard() {
    return applyDecorators(
        UseGuards(AccessTokenGuard, RolesGuard),
        Roles(UserRole.ADMIN)
    );
}
