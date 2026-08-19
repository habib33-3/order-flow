import { Prisma } from "src/generated/prisma/client";

export type CartType = Prisma.CartGetPayload<{
    select: {
        id: true;
        cartItems: {
            select: {
                quantity: true;
                product: {
                    select: {
                        id: true;
                        name: true;
                        price: true;
                        thumbnail: true;
                    };
                };
            };
        };
    };
}>;
