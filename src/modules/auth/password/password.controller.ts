import { Body, Controller, Patch } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";

import { ChangePasswordDto } from "./dto/change-password.dto";
import { PasswordService } from "./password.service";

@Controller("password")
export class PasswordController {
    constructor(private readonly passwordService: PasswordService) {}

    @Patch("change")
    @ApiOperation({
        summary: "Change the authenticated user's password",
        description:
            "Allows an authenticated user to change their password by providing their current password and a new password. The current password must be valid, and the new password must be different from the existing password.",
    })
    async changePassword(
        @CurrentUser("sub") userId: string,
        @Body() payload: ChangePasswordDto
    ) {
        return this.passwordService.changePassword(payload, userId);
    }
}
