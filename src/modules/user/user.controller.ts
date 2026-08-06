import { Body, Controller, Patch, UploadedFile } from "@nestjs/common";
import { ApiBody, ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { UploadSingleFile } from "src/common/decorators/upload.decorator";

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

    @Patch("me/avatar")
    @ApiOperation({
        summary: "Update user avatar",
        description: "Updates the authenticated user's avatar.",
    })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                image: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @UploadSingleFile("image", "image")
    async changeAvatar(
        @CurrentUser("sub") userId: string,
        @UploadedFile() image: Express.Multer.File
    ) {
        return this.userService.changeAvatar(image, userId);
    }
}
