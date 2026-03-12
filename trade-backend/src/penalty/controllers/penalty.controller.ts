// import { 
//   Controller, 
//   Post, 
//   Get, 
//   Param, 
//   Body,
//   UseGuards,
//   HttpCode,
//   HttpStatus,
//   NotFoundException 
// } from '@nestjs/common';
// import { PenaltyService } from '../services/penalty.service';
// import { WebhookAuthGuard } from '../../common/guards/webhook-auth.guard';

// @Controller('penalty')
// export class PenaltyController {
//   constructor(private readonly penaltyService: PenaltyService) {}

//   /**
//    * POST /api/penalty/process-payment
//    * Receives customer payment data and processes penalties
//    */
//   @Post('process-payment')
//   @UseGuards(WebhookAuthGuard)
//   @HttpCode(HttpStatus.OK)
//   async processPayment(@Body() body: any) {
//     try {
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//       console.log('💰 Penalty Processing Request');
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//       console.log('📋 Payment ID:', body.data?.billPaymentId || body.billPaymentId);
//       console.log('📋 Applied Bills:', body.data?.appliedBills?.length || body.appliedBills?.length || 0);

//       // Handle both formats: { data: { ... } } and direct payload
//       const paymentData = body.data || body;

//       const result = await this.penaltyService.processCustomerPayment(paymentData);

//       console.log('✅ Penalty processing initiated');
//       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

//       return result;
//     } catch (error: any) {
//       console.error('❌ Penalty Processing Error:', error.message);
//       console.error('Stack:', error.stack);
      
//       // Return a proper error response instead of throwing
//       return {
//         success: false,
//         error: error.message,
//         customerPaymentId: body.data?.billPaymentId || body.billPaymentId,
//         totalBillsProcessed: 0,
//         results: []
//       };
//     }
//   }

//   /**
//    * GET /api/penalty/:id
//    * Get penalty details by ID
//    */
//   @Get(':id')
//   async getPenaltyById(@Param('id') penaltyId: string) {
//     const penalty = await this.penaltyService.getById(penaltyId);
    
//     if (!penalty) {
//       throw new NotFoundException(`Penalty with ID ${penaltyId} not found`);
//     }
    
//     return penalty;
//   }

//   /**
//    * GET /api/penalty
//    * Get all penalties (last 100)
//    */
//   @Get()
//   async getAllPenalties() {
//     return this.penaltyService.getAll(100);
//   }

//   /**
//    * GET /api/penalty/payment/:paymentId
//    * Get penalties for a specific payment
//    */
//   @Get('payment/:paymentId')
//   async getPenaltiesByPayment(@Param('paymentId') paymentId: string) {
//     return this.penaltyService.getByPaymentId(paymentId);
//   }

//   /**
//    * GET /api/penalty/invoice/:invoiceId
//    * Get penalties for a specific invoice
//    */
//   @Get('invoice/:invoiceId')
//   async getPenaltiesByInvoice(@Param('invoiceId') invoiceId: string) {
//     return this.penaltyService.getByInvoiceId(invoiceId);
//   }
// }