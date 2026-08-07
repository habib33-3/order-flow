import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common";

import type { UploadApiResponse } from "cloudinary";

import cloudinary from "./cloudinary";

@Injectable()
export class UploadFileService {
    private readonly logger = new Logger(UploadFileService.name);

    private async uploadBuffer(
        buffer: Buffer,
        folder: string
    ): Promise<UploadApiResponse> {
        try {
            return await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder },
                    (error, result) => {
                        if (error || !result) {
                            return reject(error);
                        }

                        resolve(result);
                    }
                );

                stream.end(buffer);
            });
        } catch (error) {
            this.logger.error(
                `Failed to upload file to folder "${folder}".`,
                error instanceof Error ? error.stack : String(error)
            );

            throw new InternalServerErrorException("Failed to upload file.");
        }
    }

    private mapUploadResult(result: UploadApiResponse) {
        return {
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
        };
    }

    async uploadFile(file: Express.Multer.File, folder = "uploads") {
        this.logger.log(
            `Uploading file "${file.originalname}" to folder "${folder}".`
        );

        const result = await this.uploadBuffer(file.buffer, folder);

        this.logger.log(
            `Uploaded file "${file.originalname}" successfully (publicId: ${result.public_id}).`
        );

        return this.mapUploadResult(result);
    }

    async uploadMultipleFiles(
        files: Express.Multer.File[],
        folder = "uploads"
    ) {
        this.logger.log(
            `Uploading ${files.length} file(s) to folder "${folder}".`
        );

        const results = await Promise.all(
            files.map(async (file) => this.uploadBuffer(file.buffer, folder))
        );

        this.logger.log(
            `Successfully uploaded ${results.length} file(s) to folder "${folder}".`
        );

        return results.map((result) => this.mapUploadResult(result));
    }

    private extractPublicId(url: string): string {
        try {
            const { pathname } = new URL(url);

            const uploadIndex = pathname.indexOf("/upload/");
            if (uploadIndex === -1) {
                throw new BadRequestException("Invalid Cloudinary URL.");
            }

            let publicId = pathname.slice(uploadIndex + "/upload/".length);

            // Remove version (e.g. v123456789/)
            publicId = publicId.replace(/^v\d+\//, "");

            // Remove file extension
            publicId = publicId.replace(/\.[^.]+$/, "");

            return publicId;
        } catch {
            throw new BadRequestException("Invalid Cloudinary URL.");
        }
    }

    async deleteFile(url: string): Promise<void> {
        if (!url) {
            this.logger.warn("Delete skipped because URL is empty.");
            return;
        }

        try {
            const publicId = this.extractPublicId(url);

            this.logger.log(`Deleting file "${publicId}".`);

            const result = await cloudinary.uploader.destroy(publicId);

            if (result.result !== "ok" && result.result !== "not found") {
                throw new Error(
                    `Unexpected Cloudinary response: ${result.result}`
                );
            }

            this.logger.log(
                `Deleted file "${publicId}" (result: ${result.result}).`
            );
        } catch (error) {
            this.logger.error(
                `Failed to delete file "${url}".`,
                error instanceof Error ? error.stack : String(error)
            );

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException("Failed to delete file.");
        }
    }

    async deleteMultipleFiles(urls: string[]): Promise<void> {
        if (!urls?.length) {
            this.logger.warn("Delete skipped because no URLs were provided.");
            return;
        }

        this.logger.log(`Deleting ${urls.length} file(s).`);

        const results = await Promise.allSettled(
            urls.map(async (url) => this.deleteFile(url))
        );

        results.forEach((result, index) => {
            if (result.status === "rejected") {
                this.logger.error(
                    // eslint-disable-next-line security/detect-object-injection
                    `Failed to delete file "${urls[index]}".`,
                    result.reason instanceof Error
                        ? result.reason.stack
                        : String(result.reason)
                );
            }
        });

        this.logger.log(`Finished deleting ${urls.length} file(s).`);
    }
}
