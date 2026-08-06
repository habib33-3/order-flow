import {
    applyDecorators,
    BadRequestException,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ApiConsumes } from "@nestjs/swagger";

import { Request } from "express";

import { memoryStorage } from "multer";

export const storage = memoryStorage();

export type UploadType = "image" | "video" | "document" | "all";

const MIME_PATTERNS: Record<UploadType, RegExp> = {
    image: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
    video: /\.(mp4|mov|avi|mkv|webm)$/i,
    document: /\.(pdf|doc|docx|xls|xlsx|txt)$/i,
    all: /.*/,
};

export const fileFilter =
    (type: UploadType = "all") =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req: Request, file: Express.Multer.File, callback: any) => {
        // eslint-disable-next-line security/detect-object-injection
        const pattern = MIME_PATTERNS[type];

        if (!file.originalname.match(pattern)) {
            return callback(
                new BadRequestException(`Invalid file type. Allowed: ${type}`),
                false
            );
        }

        callback(null, true);
    };

export const limits = {
    fileSize: 10 * 1024 * 1024, // 10MB default
};

export const UploadSingleFile = (
    fieldName = "file",
    type: UploadType = "all"
) =>
    applyDecorators(
        UseInterceptors(
            FileInterceptor(fieldName, {
                storage,
                fileFilter: fileFilter(type),
                limits,
            })
        ),

        ApiConsumes("multipart/form-data")
    );

export const UploadMultipleFiles = (
    fieldName = "files",
    maxCount = 10,
    type: UploadType = "all"
) =>
    applyDecorators(
        UseInterceptors(
            FilesInterceptor(fieldName, Math.min(maxCount, 20), {
                storage,
                fileFilter: fileFilter(type),
                limits,
            })
        ),

        ApiConsumes("multipart/form-data")
    );
