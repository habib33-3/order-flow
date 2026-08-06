import { BadRequestException, Injectable } from "@nestjs/common";

import type { UploadApiResponse } from "cloudinary";

import cloudinary from "./cloudinary";

@Injectable()
export class UploadFileService {
    private async uploadBuffer(
        buffer: Buffer,
        folder: string
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder },
                (error, result) => {
                    if (error || !result) {
                        reject(error);
                        return;
                    }

                    resolve(result);
                }
            );

            stream.end(buffer);
        });
    }

    async uploadFile(file: Express.Multer.File, folder = "uploads") {
        const result = await this.uploadBuffer(file.buffer, folder);

        return {
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
        };
    }

    private extractPublicId(url: string): string {
        try {
            const { pathname } = new URL(url);

            const uploadIndex = pathname.indexOf("/upload/");
            if (uploadIndex === -1) {
                throw new BadRequestException("Invalid Cloudinary URL.");
            }

            let publicId = pathname.slice(uploadIndex + "/upload/".length);

            // Remove version if present (v123456789/)
            publicId = publicId.replace(/^v\d+\//, "");

            // Remove extension
            publicId = publicId.replace(/\.[^.]+$/, "");

            return publicId;
        } catch {
            throw new BadRequestException("Invalid Cloudinary URL.");
        }
    }

    async deleteFile(url: string): Promise<void> {
        if (!url) return;

        const publicId = this.extractPublicId(url);

        await cloudinary.uploader.destroy(publicId);
    }
}
