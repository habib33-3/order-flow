import { Body, Controller, Patch } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";

import { UpdateUserProfileDto } from "./dto/update-user.dto";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Patch("me")
    @ApiOperation({
        summary: "Update user profile",
        description:
            "Updates the authenticated user's profile information, including name and phone number.",
    })
    async updateUserProfile(
        @CurrentUser("sub") userId: string,
        @Body() payload: UpdateUserProfileDto
    ) {
        return this.userService.updateUserProfile(userId, payload);
    }
}
