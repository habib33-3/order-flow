import {
    BeforeApplicationShutdown,
    Injectable,
    Logger,
    OnModuleInit,
} from "@nestjs/common";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "src/generated/prisma/client";

import { env } from "../env/env";

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, BeforeApplicationShutdown
{
    private readonly logger = new Logger(PrismaService.name);

    private static readonly MAX_RETRIES = 5;
    private static readonly INITIAL_DELAY_MS = 1_000;

    constructor() {
        super({
            adapter: new PrismaPg({
                connectionString: env.DATABASE_URL,
            }),
        });
    }

    async onModuleInit(): Promise<void> {
        await this.connectWithRetry();
    }

    async beforeApplicationShutdown(): Promise<void> {
        this.logger.log("Disconnecting from database...");
        await this.$disconnect();
        this.logger.log("Database disconnected");
    }

    async isHealthy(): Promise<boolean> {
        try {
            await this.$queryRaw`SELECT 1`;
            return true;
        } catch {
            return false;
        }
    }

    private async connectWithRetry(): Promise<void> {
        let delay = PrismaService.INITIAL_DELAY_MS;

        for (let attempt = 1; attempt <= PrismaService.MAX_RETRIES; attempt++) {
            try {
                this.logger.log(
                    `Connecting to database (attempt ${attempt}/${PrismaService.MAX_RETRIES})...`
                );

                await this.$connect();

                this.logger.log("Database connected");

                return;
            } catch (error) {
                this.logger.error(
                    `Database connection failed (attempt ${attempt}/${PrismaService.MAX_RETRIES})`,
                    error instanceof Error ? error.stack : undefined
                );

                if (attempt === PrismaService.MAX_RETRIES) {
                    throw error;
                }

                this.logger.warn(`Retrying in ${delay} ms...`);

                await new Promise((resolve) => setTimeout(resolve, delay));

                delay *= 2; // Exponential backoff
            }
        }
    }
}
