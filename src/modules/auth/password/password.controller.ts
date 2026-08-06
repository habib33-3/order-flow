import { Body, Controller, Patch } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Public } from "src/common/decorators/public.decorator";

import { ChangePasswordDto } from "./dto/change-password.dto";
import {
    ForgotPasswordDto,
    ResetPasswordDto,
    VerifyForgotPasswordOtpDto,
} from "./dto/forget-password.dto";
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

    @Public()
    @Patch("forgot")
    @ApiOperation({
        summary: "Request password reset",
        description:
            "Initiates the password reset process by sending a one-time password (OTP) to the provided email address if it is associated with an account. For security reasons, the same response is returned regardless of whether the email exists.",
    })
    async forgotPassword(@Body() payload: ForgotPasswordDto) {
        return this.passwordService.forgotPassword(payload);
    }

    @Public()
    @Patch("verify-otp")
    @ApiOperation({
        summary: "Verify password reset OTP",
        description:
            "Verifies the one-time password (OTP) sent to the user's email address. If the OTP is valid, a short-lived password reset token is returned, which must be used to reset the password.",
    })
    async forgotPasswordVerifyOtp(@Body() payload: VerifyForgotPasswordOtpDto) {
        return this.passwordService.forgotPasswordVerifyOtp(payload);
    }

    @Public()
    @Patch("reset")
    @ApiOperation({
        summary: "Reset password",
        description:
            "Resets the user's password using a valid password reset token obtained after successful OTP verification. The reset token must be valid, unexpired, and can only be used once. The new password must be different from the current password.",
    })
    async resetPassword(@Body() payload: ResetPasswordDto) {
        return this.passwordService.resetPassword(payload);
    }
}
