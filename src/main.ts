import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { env } from "./common/env/env";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const logger = new Logger("Bootstrap");

    await app.listen(env.PORT);

    logger.log(`🚀 Application is running on: http://localhost:${env.PORT}`);
}

bootstrap().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
});
