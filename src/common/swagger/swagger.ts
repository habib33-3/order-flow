import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { ACCESS_TOKEN } from "src/modules/auth/constants/auth.constants";

export const setupSwagger = (app: INestApplication) => {
    const config = new DocumentBuilder()
        .setTitle("API Documentation")
        .setDescription("API Documentation")
        .setVersion("1.0")
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
