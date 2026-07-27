import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";

import axios, { AxiosInstance } from "axios";
import { env } from "src/common/env/env";
import { PaymentProvider } from "src/generated/prisma/enums";

import { ProviderPaymentDto } from "../dto/payment.dto";
import {
    BkashCreatePaymentResponse,
    BkashExecutePaymentResponse,
    BkashQueryPaymentResponse,
    BkashTokenResponse,
} from "./bkash.types";

@Injectable()
export class BkashStrategy {
    readonly provider = PaymentProvider.BKASH;

    private readonly client: AxiosInstance;
    private accessToken: string | null = null;
    private accessTokenExpiresAt = 0;

    constructor() {
        this.client = axios.create({
            baseURL: env.BKASH_BASE_URL,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        });
    }

    private async getGrantToken() {
        if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
            return this.accessToken;
        }

        const response = await this.client.post<BkashTokenResponse>(
            "/checkout/token/grant",
            {
                app_key: env.BKASH_APP_KEY,
                app_secret: env.BKASH_APP_SECRET,
            },
            {
                headers: {
                    username: env.BKASH_USERNAME,
                    password: env.BKASH_PASSWORD,
                },
            }
        );

        if (!response.data.id_token) {
            throw new InternalServerErrorException(
                "Failed to obtain bKash access token"
            );
        }

        this.accessToken = response.data.id_token;

        this.accessTokenExpiresAt =
            Date.now() + Math.max(response.data.expires_in - 60, 60) * 1000;

        return this.accessToken;
    }

    private async getHeaders() {
        const token = await this.getGrantToken();

        return {
            "Authorization": `Bearer ${token}`,
            "X-APP-Key": env.BKASH_APP_KEY,
        };
    }

    async createPayment(payload: ProviderPaymentDto) {
        const headers = await this.getHeaders();

        // if(payload.payment.currency !== "BDT") {
        //     throw new BadRequestException("Currency not supported");
        // }

        const response = await this.client.post<BkashCreatePaymentResponse>(
            "/checkout/create",
            {
                mode: "0011",
                payerReference: payload.user.id,
                callbackURL: `${env.SERVER_URL}/api/v1/payments/bkash/callback`,
                amount: payload.payment.amount.toString(),
                currency: "BDT",
                // currency: payload.payment.currency,
                intent: "sale",
                merchantInvoiceNumber: payload.payment.id,
            },
            {
                headers,
            }
        );

        if (!response.data.paymentID || !response.data.bkashURL) {
            throw new BadRequestException("Failed to create bKash payment");
        }

        return {
            providerPaymentId: response.data.paymentID,
            checkoutUrl: response.data.bkashURL,
        };
    }

    async executePayment(paymentId: string) {
        const headers = await this.getHeaders();

        const response = await this.client.post<BkashExecutePaymentResponse>(
            `/checkout/execute/${paymentId}`,
            {},
            {
                headers,
            }
        );

        return response.data;
    }

    async queryPayment(paymentId: string) {
        const headers = await this.getHeaders();

        const response = await this.client.post<BkashQueryPaymentResponse>(
            `/checkout/payment/status/${paymentId}`,
            {},
            {
                headers,
            }
        );

        return response.data;
    }
}
