// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { BillPaymentWebhook } from '../schemas/bill-payment-webhook.schema';
// import { NetsuiteService } from '../../netsuite/services/netsuite.service';

// @Injectable()
// export class BillPaymentService {
//   private readonly logger = new Logger(BillPaymentService.name);  // Create logger instance
//   private readonly processedCache = new Set<string>(); // In-memory cache for duplicate detection

//   constructor(
//     @InjectModel(BillPaymentWebhook.name)  // @InjectModel: Inject MongoDB model
//     private readonly webhookModel: Model<BillPaymentWebhook>, // webhookModel: Mongoose model instance
//     private readonly netsuiteService: NetsuiteService,
//   ) {}

//   async process(body: any): Promise<any> {
//     // Destructure request body
//     const { event, data } = body;
//     const cacheKey = `${data.billPaymentId}-${data.tranId}`; // // Create unique key for this payment

//     // Duplicate check 
//     // Checks for duplicate webhooks (in-memory cache) 
//     if (this.processedCache.has(cacheKey)) {
//       this.logger.log(`Duplicate webhook ignored: ${cacheKey}`);
//       return { 
//         success: true, 
//         message: 'Duplicate webhook ignored',
//         billPaymentId: data.billPaymentId 
//       };
//     }

//     this.processedCache.add(cacheKey);
//     setTimeout(() => this.processedCache.delete(cacheKey), 5 * 60 * 1000); // // Auto-cleanup after 5 minutes (5 * 60 * 1000 = 300,000 milliseconds = 5 minutes)

//     this.logger.log(` Webhook received: ${JSON.stringify({
//       event,
//       billPaymentId: data.billPaymentId,
//       appliedBillsCount: data.appliedBills?.length || 0
//     })}`);

//     // Save to MongoDB in tradetech database
//     const webhookDoc = await this.webhookModel.create({
//       event,
//       billPaymentId: data.billPaymentId,
//       tranId: data.tranId,
//       total: data.total,
//       tranDate: data.tranDate,
//       utrResponseDate: data.utrResponseDate,
//       status: data.status,
//       paymentMethod: data.paymentMethod,
//       vendor: data.vendor,
//       vendorId: data.vendorId,
//       appliedBills: data.appliedBills || [],
//       rawData: data, // Store complete payload for debugging
//       processingStatus: 'pending',
//       receivedAt: new Date(),
//     });

//     this.logger.log(` Saved to MongoDB (tradetech): ${webhookDoc._id}`);

//     // Process asynchronously
//     this.processInvoicesAsync(webhookDoc, data).catch(error => {
//       this.logger.error(` Async processing error: ${error.message}`);
//     });

//     return {
//       success: true,
//       message: 'Webhook received, processing invoices...',
//       webhookId: webhookDoc._id,
//       billPaymentId: data.billPaymentId,
//     };
//   }

//   private async processInvoicesAsync(doc: any, data: any): Promise<void> {
//     const results: any[] = [];

//     for (const bill of data.appliedBills || []) {
//       if (!bill.invoiceId) {
//         this.logger.warn(`No invoice ID for bill ${bill.billId}`);
//         results.push({
//           billId: bill.billId,
//           status: 'skipped',
//           message: 'No invoice ID found',
//         });
//         continue;
//       }

//       try {
//         this.logger.log(`Processing invoice: ${bill.invoiceId}`);
//         // For each invoice, calls netsuiteService.updateInvoice() 
//         // const result = await this.netsuiteService.updateInvoice({
//         //   invoiceId: bill.invoiceId,
//         //   billId: bill.billId,
//         //   billPaymentId: data.billPaymentId,
//         //   supplierPaymentDate: data.utrResponseDate || data.tranDate,
//         //   transactionDate: data.tranDate,
//         //   amount: bill.amount,
//         //   paymentMethod: data.paymentMethod,
//         //   status: data.status,
//         // });

//         // results.push({
//         //   invoiceId: bill.invoiceId,
//         //   billId: bill.billId,
//         //   status: 'success',
//         //   message: result.message || 'Invoice updated successfully',
//         //   alreadyUpdated: result.alreadyUpdated || false,
//         //   existingSPD: result.existingSPD || bill.existingSPD,
//         //   expectedSPD: result.expectedSPD,
//         //   validationStatus: result.validationStatus,
//         //   supplierPaymentDays: result.supplierPaymentDays || bill.supplierPaymentDays,
//         //   calculatedDueDate: result.calculatedDueDate,
//         //   flowType: result.flowType,
//         // });

//     //     this.logger.log(`Invoice ${bill.invoiceId}: ${result.message || 'Processed'}`);
//     //   } catch (error: any) {
//     //     results.push({
//     //       invoiceId: bill.invoiceId,
//     //       billId: bill.billId,
//     //       status: 'error',
//     //       error: error.message,
//     //       existingSPD: bill.existingSPD || null,
//     //     });
//     //     this.logger.error(`Invoice ${bill.invoiceId} error: ${error.message}`);
//     //   }
//     // }

//     // Update MongoDB with results
//     doc.processingStatus = results.every(r => r.status === 'success') 
//       ? 'completed' 
//       : 'partial_failure';
//     doc.updateResults = results;
//     doc.processedAt = new Date();
//     await doc.save();

//     this.logger.log(`Processing complete: ${JSON.stringify({
//       total: results.length,
//       success: results.filter(r => r.status === 'success').length,
//       skipped: results.filter(r => r.status === 'skipped').length,
//       errors: results.filter(r => r.status === 'error').length,
//     })}`);
//   }

// //   async getById(billPaymentId: string): Promise<BillPaymentWebhook | null> {
// //     return this.webhookModel
// //       .findOne({ billPaymentId })
// //       .sort({ receivedAt: -1 })
// //       .exec();
// //   }

// //   async getAll(limit: number = 100): Promise<BillPaymentWebhook[]> {
// //     return this.webhookModel
// //       .find()
// //       .sort({ receivedAt: -1 })
// //       .limit(limit)
// //       .exec();
// //   }
// // }