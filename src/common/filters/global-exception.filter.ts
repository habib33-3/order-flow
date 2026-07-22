import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common";

import { Request, Response } from "express";

import { Prisma } from "src/generated/prisma/client";

type HttpExceptionResponse = {
    statusCode: number;
    message: string | string[];
    error?: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();

        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = "Internal server error";

        if (exception instanceof HttpException) {
            status = exception.getStatus();

            const error = exception.getResponse();

            if (typeof error === "string") {
                message = error;
            } else {
                const { message: errorMessage } =
                    error as HttpExceptionResponse;

                message = Array.isArray(errorMessage)
                    ? errorMessage.join(", ")
                    : errorMessage;
            }
        } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case "P2002":
                    status = HttpStatus.CONFLICT;
                    message = "Resource already exists";
                    break;

                case "P2025":
                    status = HttpStatus.NOT_FOUND;
                    message = "Resource not found";
                    break;

                default:
                    message = "Database error";
            }
        }

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            if (exception instanceof Error) {
                this.logger.error(exception.message, exception.stack);
            } else {
                this.logger.error(String(exception));
            }
        }

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.originalUrl,
        });
    }
}
