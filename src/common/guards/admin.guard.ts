import { applyDecorators, UseGuards } from "@nestjs/common";

import { UserRole } from "src/generated/prisma/enums";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { JwtGuard } from "src/modules/auth/guards/jwt.guard";
import { RolesGuard } from "src/modules/auth/guards/role.guard";

export function AdminGuard() {
    return applyDecorators(
        UseGuards(JwtGuard, RolesGuard),
        Roles(UserRole.ADMIN)
    );
}
