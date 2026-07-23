import { randomBytes } from "node:crypto";

export const generateSku = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(2).toString("hex").toUpperCase();

    return `SKU-${timestamp}-${random}`;
};
