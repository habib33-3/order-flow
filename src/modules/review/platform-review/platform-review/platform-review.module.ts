import { Module } from "@nestjs/common";

import { PlatformReviewController } from "./platform-review.controller";
import { PlatformReviewService } from "./platform-review.service";

@Module({
    controllers: [PlatformReviewController],
    providers: [PlatformReviewService],
})
export class PlatformReviewModule {}
