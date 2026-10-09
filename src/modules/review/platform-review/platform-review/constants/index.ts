export const ReviewQuality = {
    GOOD: "good",
    BAD: "bad",
    NEUTRAL: "neutral",
} as const;

export type ReviewQualityType =
    (typeof ReviewQuality)[keyof typeof ReviewQuality];
