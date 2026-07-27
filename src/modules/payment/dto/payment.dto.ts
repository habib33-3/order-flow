import { Prisma } from "src/generated/prisma/client";
import { PaymentProvider } from "src/generated/prisma/enums";

export class PaymentItemDto {
    unitPrice: Prisma.Decimal;
    quantity: number;
    product: {
        name: string;
    };
}

class PaymentDataDto {
    id: string;
    currency: string;
    idempotencyKey: string;
    amount: Prisma.Decimal;
}

class PaymentUserDto {
    id: string;
    email: string;
    name: string;
}

export class ProviderPaymentDto {
    items: PaymentItemDto[];
    payment: PaymentDataDto;
    user: PaymentUserDto;
    orderId: string;
}

export class PaymentDto {
    userId: string;
    amount: number;
    orderId: string;
    provider: PaymentProvider;
    items: PaymentItemDto[];
    user: PaymentUserDto;
}
