import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { BillPaymentWebhook, BillPaymentWebhookSchema } from '../bill-payment/schemas/bill-payment-webhook.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BillPaymentWebhook.name, schema: BillPaymentWebhookSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}