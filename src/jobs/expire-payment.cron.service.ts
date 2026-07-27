import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { PrismaService } from "src/common/prisma/prisma.service";
import { OrderStatus, PaymentStatus } from "src/generated/prisma/enums";

@Injectable()
export class ExpirePaymentJobService {
    private readonly logger = new Logger(ExpirePaymentJobService.name);

    private readonly batchSize = 100;

    constructor(private readonly prisma: PrismaService) {}

    @Cron(CronExpression.EVERY_5_MINUTES)
    async expirePayments() {
        let totalExpired = 0;

        while (true) {
            const payments = await this.prisma.payment.findMany({
                where: {
                    status: PaymentStatus.PENDING,
                    expiresAt: {
                        lt: new Date(),
                    },
                },
                select: {
                    id: true,
                    orderId: true,
                },
                take: this.batchSize,
            });

            if (payments.length === 0) {
                break;
            }

            for (const payment of payments) {
                const expired = await this.prisma.$transaction(async (tx) => {
                    const paymentResult = await tx.payment.updateMany({
                        where: {
                            id: payment.id,
                            status: PaymentStatus.PENDING,
                        },
                        data: {
                            status: PaymentStatus.EXPIRED,
                        },
                    });

                    if (paymentResult.count === 0) {
                        return false;
                    }

                    const activePayment = await tx.payment.findFirst({
                        where: {
                            orderId: payment.orderId,
                            status: {
                                in: [PaymentStatus.PENDING, PaymentStatus.PAID],
                            },
                        },
                        select: {
                            id: true,
                        },
                    });

                    if (activePayment) {
                        return true;
                    }

                    await tx.order.updateMany({
                        where: {
                            id: payment.orderId,
                            status: OrderStatus.PENDING,
                        },
                        data: {
                            status: OrderStatus.CANCELED,
                            canceledAt: new Date(),
                        },
                    });

                    return true;
                });

                if (expired) {
                    totalExpired++;
                }
            }

            if (payments.length < this.batchSize) {
                break;
            }
        }

        if (totalExpired > 0) {
            this.logger.log(`Expired ${totalExpired} payment(s)`);
        }
    }
}
