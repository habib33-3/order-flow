import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { ExpirePaymentJobService } from "./expire-payment.cron.service";

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [ExpirePaymentJobService],
})
export class CronJobModule {}
