import { z } from "zod";

export const ProductReviewSummarySchema = z.object({
    summary: z.string().trim().min(1).max(600),
    sentiment: z.enum(["positive", "mixed", "negative", "insufficient_data"]),
    praises: z.array(z.string().trim().min(1).max(200)).max(5),
    complaints: z.array(z.string().trim().min(1).max(200)).max(5),
});

export type ProductReviewSummary = z.infer<typeof ProductReviewSummarySchema>;
