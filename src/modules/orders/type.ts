import { Prisma } from "src/generated/prisma/client";

export type OrderCartItem = {
    quantity: number;
    product: {
        id: string;
        name: string;
        thumbnail: string;
        price: Prisma.Decimal;
    };
};

export type CreatedOrder = Prisma.OrderGetPayload<{
    select: {
        id: true;
        total: true;
        user: {
            select: {
                id: true;
                name: true;
                email: true;
            };
        };
        items: {
            select: {
                productId: true;
                quantity: true;
                unitPrice: true;
                product: {
                    select: {
                        name: true;
                    };
                };
            };
        };
    };
}>;
