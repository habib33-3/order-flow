export class SendOtpDto {
    receiverName: string;
    otp: number;
    expirationMinutes: number;
    receiverEmail: string;
}
