import { Test, TestingModule } from "@nestjs/testing";

import { ProductReviewSummaryController } from "./product-review-summary.controller";
import { ProductReviewSummary } from "./product-review-summary.schema";
import { ProductReviewSummaryService } from "./product-review-summary.service";

describe("ProductReviewSummaryController", () => {
    let controller: ProductReviewSummaryController;
    let getSummary: jest.Mock;

    const summary: ProductReviewSummary = {
        summary: "Customers value its quality and ease of use.",
        sentiment: "positive",
        praises: ["Quality", "Ease of use"],
        complaints: [],
    };

    beforeEach(async () => {
        getSummary = jest.fn();
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProductReviewSummaryController],
            providers: [
                {
                    provide: ProductReviewSummaryService,
                    useValue: { getSummary },
                },
            ],
        }).compile();

        controller = module.get<ProductReviewSummaryController>(
            ProductReviewSummaryController
        );
    });

    it("returns the same structured response contract on a cache hit or miss", async () => {
        getSummary
            .mockResolvedValueOnce(summary)
            .mockResolvedValueOnce(summary);

        const cacheHit = await controller.getSummary("product-1");
        const generated = await controller.getSummary("product-1");

        expect(cacheHit).toEqual(generated);
        expect(cacheHit).toEqual(summary);
        expect(getSummary).toHaveBeenCalledTimes(2);
    });

    it("returns a generic summary when no summary could be generated", async () => {
        const genericSummary: ProductReviewSummary = {
            summary:
                "Not enough review data available to generate a summary at this time.",
            sentiment: "insufficient_data",
            praises: [],
            complaints: [],
        };
        getSummary.mockResolvedValue(genericSummary);

        await expect(controller.getSummary("product-1")).resolves.toEqual(
            genericSummary
        );
    });
});
