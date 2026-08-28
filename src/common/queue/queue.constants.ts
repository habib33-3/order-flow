export const QUEUE_NAMES = {
    EMAIL: "email",
    PAYMENT: "payment",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
