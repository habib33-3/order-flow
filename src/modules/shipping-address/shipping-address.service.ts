import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "src/common/prisma/prisma.service";
import {
    shippingAddressCacheKeyWithId,
    shippingAddressCacheKeyWithUserId,
} from "src/common/redis/cache-key";
import { RedisService } from "src/common/redis/redis.service";
import { Prisma, ShippingAddress } from "src/generated/prisma/client";

import { CreateShippingAddressDto } from "./dto/create-shipping-address.dto";
import { UpdateShippingAddressDto } from "./dto/update-shipping-address.dto";

@Injectable()
export class ShippingAddressService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService
    ) {}

    private readonly MAX_SHIPPING_ADDRESSES = 5;

    async createShippingAddress(
        payload: CreateShippingAddressDto,
        userId: string
    ) {
        const currentCount = await this.prisma.shippingAddress.count({
            where: {
                userId,
            },
        });

        if (currentCount >= this.MAX_SHIPPING_ADDRESSES) {
            throw new BadRequestException(
                `You can only save up to ${this.MAX_SHIPPING_ADDRESSES} shipping addresses.`
            );
        }

        const shippingAddress = await this.prisma.shippingAddress.create({
            data: {
                userId,
                ...payload,
            },
        });

        await Promise.all([
            this.redis.set(
                shippingAddressCacheKeyWithId(shippingAddress.id, userId),
                shippingAddress
            ),
            this.redis.delete(shippingAddressCacheKeyWithUserId(userId)),
        ]);

        return shippingAddress;
    }

    async getMyShippingAddresses(userId: string, search?: string) {
        const cacheKey = shippingAddressCacheKeyWithUserId(userId, search);

        const cachedData = await this.redis.get<ShippingAddress[]>(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const where: Prisma.ShippingAddressWhereInput = {
            userId,
        };

        if (search) {
            where.OR = [
                {
                    address: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    city: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    state: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    country: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    postalCode: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ];
        }

        const shippingAddresses = await this.prisma.shippingAddress.findMany({
            where,
        });

        await this.redis.set(cacheKey, shippingAddresses);

        return shippingAddresses;
    }

    async getShippingAddressById(id: string, userId: string) {
        const cacheKey = shippingAddressCacheKeyWithId(id, userId);

        const cachedShippingAddress =
            await this.redis.get<ShippingAddress>(cacheKey);

        if (cachedShippingAddress) {
            return cachedShippingAddress;
        }

        const shippingAddress = await this.prisma.shippingAddress.findUnique({
            where: { id, userId },
        });

        if (!shippingAddress) {
            throw new NotFoundException("Shipping address not found");
        }

        await this.redis.set(cacheKey, shippingAddress);

        return shippingAddress;
    }

    async updateShippingAddress(
        payload: UpdateShippingAddressDto,
        id: string,
        userId: string
    ) {
        await this.getShippingAddressById(id, userId);

        const updatedShippingAddress = await this.prisma.shippingAddress.update(
            {
                where: {
                    id,
                },
                data: payload,
            }
        );

        await Promise.all([
            this.redis.set(
                shippingAddressCacheKeyWithId(id, userId),
                updatedShippingAddress
            ),
            this.redis.delete(shippingAddressCacheKeyWithUserId(userId)),
        ]);

        return updatedShippingAddress;
    }

    async deleteShippingList(userId: string, id: string) {
        await this.getShippingAddressById(id, userId);

        await this.prisma.shippingAddress.delete({
            where: {
                id,
            },
        });

        await Promise.all([
            this.redis.delete(shippingAddressCacheKeyWithId(id, userId)),
            this.redis.delete(shippingAddressCacheKeyWithUserId(userId)),
        ]);

        return {
            message: "Shipping address deleted successfully",
        };
    }

    async generateShippingAddress(id: string, userId: string) {
        const shippingAddress = await this.getShippingAddressById(id, userId);

        const formattedAddress = [
            shippingAddress.address,
            shippingAddress.city,
            shippingAddress.state,
            shippingAddress.postalCode,
            shippingAddress.country,
        ]
            .filter(Boolean)
            .join(", ");

        return formattedAddress;
    }
}
