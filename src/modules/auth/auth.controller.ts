import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Public } from "src/common/decorators/public.decorator";

import { AuthService } from "./auth.service";
import { LoginUserDto } from "./dto/login.dto";
import { RegisterUserDto } from "./dto/registration.dto";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post("register")
    @ApiOperation({
        summary: "Register a new user",
        description: `Creates a new user account using the provided name, email, and password. 
            The email address must be unique. Returns the newly created user's authentication details upon successful registration.`,
        security: [],
    })
    async registerUser(@Body() payload: RegisterUserDto) {
        return this.authService.registerUser(payload);
    }

    @Public()
    @Post("login")
    @ApiOperation({
        summary: "Authenticate a user",
        description: `Authenticates an existing user using their email address and password.
            If the credentials are valid, the API returns an authentication token that can be used to access protected endpoints.`,
        security: [],
    })
    async loginUser(@Body() payload: LoginUserDto) {
        return this.authService.login(payload);
    }

    @Get("me")
    @ApiOperation({
        summary: "Get current user",
        description: `Returns the currently authenticated user's details.`,
    })
    async getCurrentUser(@CurrentUser("sub") userId: string) {
        return this.authService.getCurrentUser(userId);
    }
}
