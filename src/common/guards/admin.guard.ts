import { applyDecorators, UseGuards } from "@nestjs/common";

import { UserRole } from "src/generated/prisma/enums";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { AccessTokenGuard } from "src/modules/auth/guards/access-token.guard";
import { RolesGuard } from "src/modules/auth/guards/role.guard";

export function AdminGuard() {
    return applyDecorators(
        UseGuards(AccessTokenGuard, RolesGuard),
        Roles(UserRole.ADMIN)
    );
}
