// import { 
//   Controller,  // Marks class as controller
//   Post, 
//   Get, 
//   Param, 
//   Body, 
//   UseGuards,
//   HttpCode,
//   HttpStatus,
//   NotFoundException 
// } from '@nestjs/common';
// import { BillPaymentService } from '../services/bill-payment.service'; //  Import business logic service
// import { WebhookAuthGuard } from '../../common/guards/webhook-auth.guard'; // Import security guard


// // Receives HTTP request
// @Controller('webhook')
// export class BillPaymentController {
//   constructor(private readonly billPaymentService: BillPaymentService) {}

//   @Post('bill-payment')
//   // @Post: HTTP POST method (  Route: /webhooks/bill-payment)
//   // Combines: controller path (/webhooks) + method path (/bill-payment)
//   @UseGuards(WebhookAuthGuard)
//   @HttpCode(HttpStatus.OK)
//   // Extracts body data
//   async handleBillPaymentWebhook(@Body() body: any) {
//     // @Body(): Extract request body
//     return this.billPaymentService.process(body); // Call business logic service
//   }

//   @Get('bill-payment/:id')
//   // @Get: HTTP GET method
//   // Route: /webhooks/bill-payment/5358449
//   async getWebhookStatus(@Param('id') billPaymentId: string) {
//     const webhook = await this.billPaymentService.getById(billPaymentId);
//     // Call service to fetch from MongoDB
//     if (!webhook) {
//       throw new NotFoundException(`Webhook with bill payment ID ${billPaymentId} not found`);
//     }
    
//     return webhook;
//   }

//   @Get('bill-payment')
//    // Route: /webhooks/bill-payment
//   // Get all webhooks (no parameter)
//   async getAllWebhooks() {
//     return this.billPaymentService.getAll(100); // Get last 100 webhooks
//   }
// }