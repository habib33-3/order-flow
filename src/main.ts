/* eslint-disable no-console */
/* eslint-disable n/prefer-global/process */
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((e) => {
    console.error(e);
});
