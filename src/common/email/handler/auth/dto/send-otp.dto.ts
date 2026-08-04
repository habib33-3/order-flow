export class SendOtpDto {
    receiverName: string;
    otp: string;
    expirationMinutes: number;
    receiverEmail: string;
}
