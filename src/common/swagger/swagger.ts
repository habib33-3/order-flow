import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { ACCESS_TOKEN } from "src/modules/auth/constants/auth.constants";

import * as packageJson from "../../../package.json";
import { env } from "../env/env";

export const setupSwagger = (app: INestApplication) => {
    const config = new DocumentBuilder()
        .setTitle(env.APP_NAME)
        .setDescription(packageJson.description)
        .setVersion(packageJson.version)
        .addBearerAuth(
            {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
            ACCESS_TOKEN
        )
        .addSecurityRequirements(ACCESS_TOKEN)
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup("api/docs", app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
};
