import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { UserRole } from "src/generated/prisma/enums";
import { JwtPayload } from "src/types/types";

import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        const user = request.user as JwtPayload;

        if (!user) {
            throw new ForbiddenException("User is not authenticated");
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException(
                "You do not have permission to access this resource"
            );
        }

        return true;
    }
}
