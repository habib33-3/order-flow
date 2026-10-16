import { ProductReviewSummary } from "./product-review-summary.schema";

export const MAX_REVIEWS = 100;
export const MAX_REVIEW_CHARS = 500;
export const MIN_REVIEWS = 3;
export const SUMMARY_TTL = 12 * 60 * 60;
export const PROMPT_VERSION = "v1";

export const GENERIC_REVIEW_SUMMARY: ProductReviewSummary = {
    summary:
        "Not enough review data available to generate a summary at this time.",
    sentiment: "insufficient_data",
    praises: [],
    complaints: [],
};
