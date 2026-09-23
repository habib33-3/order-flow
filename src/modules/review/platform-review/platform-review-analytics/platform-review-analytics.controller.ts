import { Controller } from "@nestjs/common";

import { PlatformReviewAnalyticsService } from "./platform-review-analytics.service";

@Controller("review/platform/analytics")
export class PlatformReviewAnalyticsController {
    constructor(
        private readonly platformReviewAnalyticsService: PlatformReviewAnalyticsService
    ) {}
}
