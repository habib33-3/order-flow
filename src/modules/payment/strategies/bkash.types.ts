export type BkashTokenResponse = {
    id_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
};

export type BkashCreatePaymentResponse = {
    paymentID: string;
    createTime: string;
    orgLogo: string;
    orgName: string;
    transactionStatus: string;
    amount: string;
    currency: string;
    intent: string;
    merchantInvoiceNumber: string;
    bkashURL: string;
};

export type BkashExecutePaymentResponse = {
    paymentID: string;
    trxID: string;
    transactionStatus: string;
    amount: string;
    currency: string;
    intent: string;
    merchantInvoiceNumber: string;
};

export type BkashQueryPaymentResponse = {
    paymentID: string;
    trxID?: string;
    transactionStatus: string;
    amount: string;
    currency: string;
    intent: string;
    merchantInvoiceNumber: string;
};
