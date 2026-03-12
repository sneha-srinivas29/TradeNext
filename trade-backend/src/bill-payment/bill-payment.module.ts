// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { BillPaymentController } from './controllers/bill-payment.controller';
// import { BillPaymentService } from './services/bill-payment.service';
// import { BillPaymentWebhook, BillPaymentWebhookSchema } from './schemas/bill-payment-webhook.schema';
// import { NetsuiteModule } from '../netsuite/netsuite.module';

// @Module({
//     // Registers MongoDB schema
//   imports: [
//     MongooseModule.forFeature([
//          // forFeature: Register MongoDB schemas for THIS module only
//          // Different from forRoot (global connection)
//       { name: BillPaymentWebhook.name, schema: BillPaymentWebhookSchema },  // name: Model name to use in code
//     ]),
//     // Imports NetsuiteModule (for API calls) , Import NetsuiteModule to use NetsuiteService
//     NetsuiteModule,
//   ],
//   // Registers BillPaymentController (routes)
//   // Registers BillPaymentService (business logic)
//   controllers: [BillPaymentController], // / NestJS will scan these for @Get, @Post decorators , Creates routes: /api/webhooks/bill-payment
//   providers: [BillPaymentService],   // Register services (business logic) , Makes BillPaymentService injectable
//   exports: [BillPaymentService],  // Makes service available to OTHER modules
// })
// export class BillPaymentModule {}