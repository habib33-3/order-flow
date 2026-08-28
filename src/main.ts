import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import helmet from "helmet";

import { AppModule } from "./app.module";
import { env } from "./common/env/env";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { setupSwagger } from "./common/swagger/swagger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        rawBody: true,
    });

    app.enableShutdownHooks();

    app.setGlobalPrefix("api/v1", {
        exclude: ["/", "/queues", "/queues/{*path}"],
    });

    app.use(helmet());

    app.enableCors();

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        })
    );

    app.useGlobalFilters(new GlobalExceptionFilter());

    setupSwagger(app);

    await app.listen(env.PORT);

    const logger = new Logger("Bootstrap");

    logger.log(`Application is running on: http://localhost:${env.PORT}`);
    logger.log(`API docs: http://localhost:${env.PORT}/api/docs`);
}

bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Error starting the application:", err);
    // eslint-disable-next-line no-process-exit, n/prefer-global/process
    process.exit(1);
});
