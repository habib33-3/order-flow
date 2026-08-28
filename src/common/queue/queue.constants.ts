export const QUEUE_NAMES = {
    EMAIL: "email",
    PAYMENT: "payment",
} as const;

export type QueueName = keyof typeof QUEUE_NAMES;
