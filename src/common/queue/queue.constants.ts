export const QUEUE_NAMES = {
    EMAIL: "email",
    INVOICE: "invoice",
} as const;

export type QueueName = keyof typeof QUEUE_NAMES;
