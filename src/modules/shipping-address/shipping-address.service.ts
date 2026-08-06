import { Injectable } from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    shippingAddressCacheKeyWithId,
    shippingAddressCacheKeyWithUserId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";

import { CreateShippingAddressDto } from "./dto/create-shipping-address.dto";

@Injectable()
export class ShippingAddressService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService
    ) {}

    async createShippingAddress(
        payload: CreateShippingAddressDto,
        userId: string
    ) {
        const shippingAddress = await this.prisma.shippingAddress.create({
            data: {
                userId,
                ...payload,
            },
        });

        await Promise.all([
            this.redis.set(
                shippingAddressCacheKeyWithId(shippingAddress.id),
                shippingAddress
            ),
            this.redis.delete(shippingAddressCacheKeyWithUserId(userId)),
        ]);

        return shippingAddress;
    }
}
