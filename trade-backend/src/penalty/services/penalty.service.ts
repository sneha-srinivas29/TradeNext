// // import { Injectable, Logger } from '@nestjs/common';
// // import { InjectModel } from '@nestjs/mongoose';
// // import { Model } from 'mongoose';
// // import { Penalty } from '../schemas/penalty.schema';
// // import { NetsuiteService } from '../../netsuite/services/netsuite.service';

// // @Injectable()
// // export class PenaltyService {
// //   private readonly logger = new Logger(PenaltyService.name);

// //   constructor(
// //     @InjectModel(Penalty.name)
// //     private readonly penaltyModel: Model<Penalty>,
// //     private readonly netsuiteService: NetsuiteService,
// //   ) {}

// //   /**
// //    * PROCESS CUSTOMER PAYMENT FOR PENALTIES
// //    */
// //   async processCustomerPayment(paymentData: any): Promise<any> {
// //     try {
// //       this.logger.log(`🔍 Processing customer payment for penalties: ${paymentData.billPaymentId}`);

// //       if (!paymentData.billPaymentId) {
// //         throw new Error('Missing billPaymentId in webhook data');
// //       }

// //       if (!paymentData.appliedBills || !Array.isArray(paymentData.appliedBills)) {
// //         throw new Error('Missing or invalid appliedBills array');
// //       }

// //       const results: any[] = [];

// //       for (const bill of paymentData.appliedBills) {
// //         try {
// //           const result = await this.processSingleBill(paymentData, bill);
// //           results.push(result);
// //         } catch (error: any) {
// //           this.logger.error(`❌ Error processing bill ${bill.billId}: ${error.message}`);
// //           results.push({
// //             billId: bill.billId,
// //             invoiceId: bill.invoiceId,
// //             status: 'failed',
// //             error: error.message,
// //           });
// //         }
// //       }

// //       return {
// //         success: true,
// //         customerPaymentId: paymentData.billPaymentId,
// //         totalBillsProcessed: results.length,
// //         results,
// //       };
// //     } catch (error: any) {
// //       this.logger.error(`❌ Error processing customer payment: ${error.message}`);
// //       throw error;
// //     }
// //   }

// //   /**
// //    * PROCESS SINGLE BILL FOR PENALTY
// //    */
// //   private async processSingleBill(paymentData: any, bill: any): Promise<any> {
// //     try {
// //       // Check if penalty already exists in MongoDB
// //       const existing = await this.penaltyModel.findOne({
// //         customerPaymentId: paymentData.billPaymentId,
// //         invoiceId: bill.invoiceId,
// //         installmentNumber: bill.installmentNumber || 1,
// //       });

// //       if (existing) {
// //         this.logger.warn(`⚠️ Penalty already exists for invoice ${bill.invoiceId}`);
// //         return {
// //           billId: bill.billId,
// //           invoiceId: bill.invoiceId,
// //           status: 'already_exists',
// //           penaltyId: existing._id,
// //         };
// //       }

// //       // Check eligibility
// //       if (bill.isEligible === false) {
// //         this.logger.log(`ℹ️ Not eligible for penalty: ${bill.eligibilityReason}`);
// //         return {
// //           billId: bill.billId,
// //           invoiceId: bill.invoiceId,
// //           status: 'not_eligible',
// //           reason: bill.eligibilityReason,
// //         };
// //       }

// //       // Fetch invoice details from NetSuite
// //       const invoiceDetails = await this.fetchInvoiceDetails(bill.invoiceId);

// //       // Determine origination type
// //       const originationType = this.determineOriginationType(invoiceDetails);

// //       // Build eligibility data
// //       const eligibility = {
// //         isEligible: bill.isEligible !== false,
// //         isDueDateCrossed: bill.calcDays > 0,
// //         calcDays: bill.calcDays || 0,
// //         dueDate: bill.dueDate ? this.parseDate(bill.dueDate) : new Date(invoiceDetails.dueDate),
// //         graceDate: invoiceDetails.graceDate,
// //         collectableDate: invoiceDetails.collectableDate,
// //         milestoneDueAmount: invoiceDetails.milestoneDueAmount,
// //         reason: bill.eligibilityReason || 'Eligible for penalty',
// //       };

// //       // Create penalty record in MongoDB
// //       const penalty = await this.createPenaltyRecord(
// //         paymentData,
// //         bill,
// //         invoiceDetails,
// //         originationType,
// //         eligibility,
// //       );

// //       // Process penalty asynchronously
// //       this.processPenaltyAsync(penalty).catch((error) => {
// //         this.logger.error(`❌ Async penalty processing failed: ${error.message}`);
// //       });

// //       return {
// //         billId: bill.billId,
// //         invoiceId: bill.invoiceId,
// //         status: 'processing',
// //         penaltyId: penalty._id,
// //       };
// //     } catch (error: any) {
// //       this.logger.error(`❌ Error in processSingleBill: ${error.message}`);
// //       throw error;
// //     }
// //   }

// //   /**
// //    * CREATE PENALTY RECORD IN MONGODB
// //    */
// //   private async createPenaltyRecord(
// //     paymentData: any,
// //     bill: any,
// //     invoiceDetails: any,
// //     originationType: string,
// //     eligibility: any,
// //   ): Promise<Penalty> {
// //     const penalty = await this.penaltyModel.create({
// //       customerPaymentId: paymentData.billPaymentId,
// //       invoiceId: bill.invoiceId,
// //       installmentNumber: bill.installmentNumber || 1,
// //       originationType,
// //       customer: invoiceDetails.customer,
// //       vendor: invoiceDetails.vendor,
// //       salesOrderId: bill.salesOrderId,
// //       billId: bill.billId,
// //       tradeNumber: invoiceDetails.tradeNumber,
// //       location: invoiceDetails.location,
// //       subsidiary: invoiceDetails.subsidiary,
// //       class: invoiceDetails.class,
// //       milestoneDueDate: eligibility.dueDate,
// //       paymentDate: this.parseDate(paymentData.utrResponseDate),
// //       graceDate: eligibility.graceDate,
// //       collectableDate: eligibility.collectableDate,
// //       paidAmount: bill.amount,
// //       appliedAmount: bill.amount,
// //       invoiceAmount: invoiceDetails.total,
// //       milestoneDueAmount: eligibility.milestoneDueAmount,
// //       penalInterest: invoiceDetails.penalInterest,
// //       calcDays: eligibility.calcDays,
// //       gstRetention: invoiceDetails.gstRetention,
// //       taxTotal: invoiceDetails.taxTotal,
// //       invoiceGrossAmount: invoiceDetails.grossAmount,
// //       supplierPaymentDays: bill.supplierPaymentDays || 0,
// //       contractedMargin: 0,
// //       isDueDateCrossed: eligibility.isDueDateCrossed,
// //       isEligibleForPenalty: eligibility.isEligible,
// //       eligibilityReason: eligibility.reason,
// //       rawWebhookData: paymentData,
// //       processingStatus: 'received',
// //     });

// //     this.logger.log(`✅ Penalty record created in MongoDB: ${penalty._id}`);
// //     return penalty;
// //   }

// //   /**
// //    * PROCESS PENALTY ASYNCHRONOUSLY
// //    * For BUYER: Create PNC
// //    * For SUPPLIER: Create Bill Credit Document
// //    */
// //   private async processPenaltyAsync(penalty: Penalty): Promise<void> {
// //     try {
// //       this.logger.log(`🔄 Starting async penalty processing: ${penalty._id}`);
// //       this.logger.log(`📋 Origination Type: ${penalty.originationType}`);

// //       if (penalty.originationType === 'buyer') {
// //         // ============================================
// //         // BUYER ORIGINATED: Create PNC
// //         // ============================================
// //         penalty.processingStatus = 'pnc_checking';
// //         await penalty.save();

// //         const pncResult = await this.checkAndSyncPNC(penalty);
        
// //         penalty.pnc = {
// //           pncId: pncResult.pncId,
// //           existsInNetSuite: pncResult.exists,
// //           createdByScript: pncResult.created ? 'middleware' : 'netsuite_script',
// //           createdAt: new Date(),
// //           invoiceId: penalty.invoiceId,
// //           installmentNumber: penalty.installmentNumber,
// //           paymentDocumentNo: penalty.customerPaymentId,
// //           installmentDueDate: penalty.milestoneDueDate,
// //           paymentDate: penalty.paymentDate,
// //           tradeNumber: penalty.tradeNumber,
// //           paidAmount: penalty.paidAmount,
// //           paymentAmountExclTax: this.calculateAmountExclTax(penalty),
// //           collectableDate: penalty.collectableDate,
// //           calcDays: penalty.calcDays,
// //         };

// //         penalty.processingStatus = 'pnc_created';
// //         await penalty.save();

// //         this.logger.log(`✅ Buyer originated - PNC created: ${pncResult.pncId}`);

// //       } else {
// //         // ============================================
// //         // SUPPLIER ORIGINATED: Create Bill Credit Document
// //         // ============================================
// //         penalty.processingStatus = 'bill_credit_checking';
// //         await penalty.save();

// //         const bcResult = await this.checkAndSyncBillCredit(penalty);

// //         penalty.penaltyBillCredit = {
// //           billCreditId: bcResult.billCreditId,
// //           created: bcResult.created,
// //           billCreditNumber: '',
// //           totalAmount: 0,
// //           taxAmount: 0,
// //           lineItems: [],
// //           createdAt: new Date(),
// //           createdBy: bcResult.created ? 'middleware' : 'netsuite_script',
// //           status: bcResult.created ? 'created' : 'existing',
// //           errorMessage: '',
// //           derivedAnnualMargin: 0,
// //           contractedMargin: 0,
// //           creditPeriodDays: penalty.supplierPaymentDays,
// //         };

// //         penalty.processingStatus = 'bill_credit_created';
// //         await penalty.save();

// //         this.logger.log(`✅ Supplier originated - Bill Credit created: ${bcResult.billCreditId}`);
// //       }

// //       penalty.processingStatus = 'completed';
// //       penalty.processedAt = new Date();
// //       await penalty.save();

// //       this.logger.log(`✅ Penalty processing completed: ${penalty._id}`);
// //     } catch (error: any) {
// //       penalty.processingStatus = 'failed';
// //       penalty.processingError = error.message;
// //       penalty.retryCount += 1;
// //       penalty.lastRetryAt = new Date();
// //       await penalty.save();

// //       this.logger.error(`❌ Penalty processing failed: ${error.message}`);
// //       throw error;
// //     }
// //   }

// //   /**
// //    * CHECK AND SYNC PNC IN NETSUITE (BUYER ORIGINATED)
// //    */
// //   private async checkAndSyncPNC(penalty: Penalty): Promise<any> {
// //     try {
// //       const payload = {
// //         operation: 'checkAndSyncPNC',
// //         invoiceId: penalty.invoiceId,
// //         installmentNum: penalty.installmentNumber,
// //         paymentId: penalty.customerPaymentId,
// //         dueDate: this.formatDate(penalty.milestoneDueDate),
// //         paymentDate: this.formatDate(penalty.paymentDate),
// //         paidAmount: penalty.paidAmount,
// //         paidAmountExclTax: this.calculateAmountExclTax(penalty),
// //         tradeNumber: penalty.tradeNumber,
// //         collectableDate: penalty.collectableDate ? this.formatDate(penalty.collectableDate) : null,
// //       };

// //       const response = await this.netsuiteService.managePenalty(payload);

// //       if (response.success) {
// //         this.logger.log(`✅ PNC synced: ${response.pncId} (${response.exists ? 'existing' : 'created'})`);
// //         return {
// //           pncId: response.pncId,
// //           exists: response.exists,
// //           created: !response.exists,
// //           upToDate: response.upToDate,
// //           updated: response.updated,
// //         };
// //       } else {
// //         throw new Error(response.error || 'PNC sync failed');
// //       }
// //     } catch (error: any) {
// //       this.logger.error(`❌ PNC sync failed: ${error.message}`);
// //       throw error;
// //     }
// //   }

// //   /**
// //    * CHECK AND SYNC BILL CREDIT DOCUMENT IN NETSUITE (SUPPLIER ORIGINATED)
// //    */
// //   private async checkAndSyncBillCredit(penalty: Penalty): Promise<any> {
// //     try {
// //       const payload = {
// //         operation: 'checkAndSyncBillCredit',
// //         invoiceId: penalty.invoiceId,
// //         installmentNum: penalty.installmentNumber,
// //         paymentId: penalty.customerPaymentId,
// //         dueDate: this.formatDate(penalty.milestoneDueDate),
// //         paymentDate: this.formatDate(penalty.paymentDate),
// //         paidAmount: penalty.paidAmount,
// //         tradeNumber: penalty.tradeNumber,
// //         collectableDate: penalty.collectableDate ? this.formatDate(penalty.collectableDate) : null,
// //         graceDate: penalty.graceDate ? this.formatDate(penalty.graceDate) : null,
// //         milestoneDueAmount: penalty.milestoneDueAmount,
// //         gstRetention: penalty.gstRetention,
// //         taxTotal: penalty.taxTotal,
// //       };

// //       const response = await this.netsuiteService.managePenalty(payload);

// //       if (response.success) {
// //         this.logger.log(`✅ Bill Credit synced: ${response.billCreditId} (${response.exists ? 'existing' : 'created'})`);
// //         return {
// //           billCreditId: response.billCreditId,
// //           exists: response.exists,
// //           created: !response.exists,
// //           upToDate: response.upToDate,
// //           updated: response.updated,
// //         };
// //       } else {
// //         throw new Error(response.error || 'Bill Credit sync failed');
// //       }
// //     } catch (error: any) {
// //       this.logger.error(`❌ Bill Credit sync failed: ${error.message}`);
// //       throw error;
// //     }
// //   }

// //   /**
// //    * HELPER: Calculate amount excluding tax
// //    */
// //   private calculateAmountExclTax(penalty: Penalty): number {
// //     if (penalty.gstRetention && penalty.taxTotal && penalty.invoiceAmount) {
// //       const taxRate = penalty.taxTotal / (penalty.invoiceAmount - penalty.taxTotal);
// //       return penalty.paidAmount / (1 + taxRate);
// //     }
// //     return penalty.paidAmount;
// //   }

// //   /**
// //    * HELPER: Format date to DD/MM/YYYY for NetSuite
// //    */
// //   private formatDate(date: Date | null | undefined): string {
// //     if (!date) return '';
    
// //     const d = new Date(date);
// //     const day = String(d.getDate()).padStart(2, '0');
// //     const month = String(d.getMonth() + 1).padStart(2, '0');
// //     const year = d.getFullYear();
    
// //     return `${day}/${month}/${year}`;
// //   }

// //   /**
// //    * HELPER: Determine origination type
// //    */
// //   private determineOriginationType(invoiceDetails: any): string {
// //     return invoiceDetails.transactionOrigin === 1 ? 'buyer' : 'supplier';
// //   }

// //   /**
// //    * HELPER: Parse date string from DD/MM/YYYY or ISO format
// //    */
// //   private parseDate(dateStr: string): Date {
// //     if (!dateStr) return new Date();
    
// //     if (dateStr.includes('/')) {
// //       const parts = dateStr.split('/');
// //       if (parts.length === 3) {
// //         const day = parseInt(parts[0], 10);
// //         const month = parseInt(parts[1], 10) - 1;
// //         const year = parseInt(parts[2], 10);
        
// //         if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
// //           return new Date(year, month, day);
// //         }
// //       }
// //     }
    
// //     const isoDate = new Date(dateStr);
// //     if (!isNaN(isoDate.getTime())) {
// //       return isoDate;
// //     }
    
// //     this.logger.warn(`⚠️ Could not parse date: ${dateStr}, using current date`);
// //     return new Date();
// //   }

// //   /**
// //    * HELPER: Fetch invoice details from NetSuite
// //    */
// //   private async fetchInvoiceDetails(invoiceId: string): Promise<any> {
// //     const payload = {
// //       operation: 'getInvoiceDetails',
// //       invoiceId,
// //     };
    
// //     return await this.netsuiteService.managePenalty(payload);
// //   }

// //   // ===== GET METHODS =====
// //   async getById(penaltyId: string): Promise<Penalty | null> {
// //     return await this.penaltyModel.findById(penaltyId);
// //   }

// //   async getAll(limit: number = 100): Promise<Penalty[]> {
// //     return await this.penaltyModel
// //       .find()
// //       .sort({ createdAt: -1 })
// //       .limit(limit);
// //   }

// //   async getByPaymentId(paymentId: string): Promise<Penalty[]> {
// //     return await this.penaltyModel
// //       .find({ customerPaymentId: paymentId })
// //       .sort({ createdAt: -1 });
// //   }

// //   async getByInvoiceId(invoiceId: string): Promise<Penalty[]> {
// //     return await this.penaltyModel
// //       .find({ invoiceId })
// //       .sort({ createdAt: -1 });
// //   }
// // }

// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Penalty } from '../schemas/penalty.schema';
// import { NetsuiteService } from '../../netsuite/services/netsuite.service';

// @Injectable()
// export class PenaltyService {
//   private readonly logger = new Logger(PenaltyService.name);

//   constructor(
//     @InjectModel(Penalty.name)
//     private readonly penaltyModel: Model<Penalty>,
//     private readonly netsuiteService: NetsuiteService,
//   ) {}

//   /**
//    * PROCESS CUSTOMER PAYMENT FOR PENALTIES
//    * Called when customer payment webhook is received
//    */
//   async processCustomerPayment(paymentData: any): Promise<any> {
//     try {
//       this.logger.log(`🔍 Processing customer payment for penalties: ${paymentData.billPaymentId}`);

//       // Validate input
//       if (!paymentData.billPaymentId) {
//         throw new Error('Missing billPaymentId in webhook data');
//       }

//       if (!paymentData.appliedBills || !Array.isArray(paymentData.appliedBills)) {
//         throw new Error('Missing or invalid appliedBills array');
//       }

//       const results: any[] = [];

//       // Process each applied bill
//       for (const bill of paymentData.appliedBills) {
//         try {
//           const result = await this.processSingleBill(paymentData, bill);
//           results.push(result);
//         } catch (error: any) {
//           this.logger.error(`❌ Error processing bill ${bill.billId}: ${error.message}`);
//           this.logger.error(`Stack trace: ${error.stack}`);
//           results.push({
//             billId: bill.billId,
//             invoiceId: bill.invoiceId,
//             status: 'failed',
//             error: error.message,
//           });
//         }
//       }

//       return {
//         success: true,
//         customerPaymentId: paymentData.billPaymentId,
//         totalBillsProcessed: results.length,
//         results,
//       };
//     } catch (error: any) {
//       this.logger.error(`❌ Error processing customer payment: ${error.message}`);
//       this.logger.error(`Stack trace: ${error.stack}`);
//       throw error;
//     }
//   }

//   /**
//    * PROCESS SINGLE BILL FOR PENALTY
//    */
//   private async processSingleBill(paymentData: any, bill: any): Promise<any> {
//     try {
//       // Check if penalty already exists
//       const existing = await this.penaltyModel.findOne({
//         customerPaymentId: paymentData.billPaymentId,
//         invoiceId: bill.invoiceId,
//         installmentNumber: bill.installmentNumber || 1,
//       });

//       if (existing) {
//         this.logger.warn(`⚠️ Penalty already exists for invoice ${bill.invoiceId}`);
//         return {
//           billId: bill.billId,
//           invoiceId: bill.invoiceId,
//           status: 'already_exists',
//           penaltyId: existing._id,
//         };
//       }

//       // Check if eligible based on webhook data
//       if (bill.isEligible === false) {
//         this.logger.log(`ℹ️ Not eligible for penalty: ${bill.eligibilityReason}`);
//         return {
//           billId: bill.billId,
//           invoiceId: bill.invoiceId,
//           status: 'not_eligible',
//           reason: bill.eligibilityReason,
//         };
//       }

//       // Fetch invoice details from NetSuite
//       const invoiceDetails = await this.fetchInvoiceDetails(bill.invoiceId);

//       // Determine origination type
//       const originationType = this.determineOriginationType(invoiceDetails);

//       // Use eligibility from webhook or check again
//       const eligibility = {
//         isEligible: bill.isEligible !== false,
//         isDueDateCrossed: bill.calcDays > 0,
//         calcDays: bill.calcDays || 0,
//         dueDate: bill.dueDate ? this.parseDate(bill.dueDate) : new Date(invoiceDetails.dueDate),
//         graceDate: invoiceDetails.graceDate,
//         collectableDate: invoiceDetails.collectableDate,
//         milestoneDueAmount: invoiceDetails.milestoneDueAmount,
//         reason: bill.eligibilityReason || 'Eligible for penalty',
//       };

//       // Create penalty record
//       const penalty = await this.createPenaltyRecord(
//         paymentData,
//         bill,
//         invoiceDetails,
//         originationType,
//         eligibility,
//       );

//       // Process penalty asynchronously
//       this.processPenaltyAsync(penalty).catch((error) => {
//         this.logger.error(`❌ Async penalty processing failed: ${error.message}`);
//       });

//       return {
//         billId: bill.billId,
//         invoiceId: bill.invoiceId,
//         status: 'processing',
//         penaltyId: penalty._id,
//       };
//     } catch (error: any) {
//       this.logger.error(`❌ Error in processSingleBill: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * CREATE PENALTY RECORD IN DB
//    */
//   private async createPenaltyRecord(
//     paymentData: any,
//     bill: any,
//     invoiceDetails: any,
//     originationType: string,
//     eligibility: any,
//   ): Promise<Penalty> {
//     const penalty = await this.penaltyModel.create({
//       customerPaymentId: paymentData.billPaymentId,
//       invoiceId: bill.invoiceId,
//       installmentNumber: bill.installmentNumber || 1,
//       originationType,
//       customer: invoiceDetails.customer,
//       vendor: invoiceDetails.vendor,
//       salesOrderId: bill.salesOrderId,
//       billId: bill.billId,
//       tradeNumber: invoiceDetails.tradeNumber,
//       location: invoiceDetails.location,
//       subsidiary: invoiceDetails.subsidiary,
//       class: invoiceDetails.class,
//       milestoneDueDate: eligibility.dueDate,
//       paymentDate: this.parseDate(paymentData.utrResponseDate),
//       graceDate: eligibility.graceDate,
//       collectableDate: eligibility.collectableDate,
//       paidAmount: bill.amount,
//       appliedAmount: bill.amount,
//       invoiceAmount: invoiceDetails.total,
//       milestoneDueAmount: eligibility.milestoneDueAmount,
//       penalInterest: invoiceDetails.penalInterest,
//       calcDays: eligibility.calcDays,
//       gstRetention: invoiceDetails.gstRetention,
//       taxTotal: invoiceDetails.taxTotal,
//       invoiceGrossAmount: invoiceDetails.grossAmount,
//       supplierPaymentDays: bill.supplierPaymentDays || 0,
//       contractedMargin: 0,
//       isDueDateCrossed: eligibility.isDueDateCrossed,
//       isEligibleForPenalty: eligibility.isEligible,
//       eligibilityReason: eligibility.reason,
//       rawWebhookData: paymentData,
//       processingStatus: 'received',
//     });

//     this.logger.log(`✅ Penalty record created: ${penalty._id}`);
//     return penalty;
//   }

//   /**
//    * PROCESS PENALTY ASYNCHRONOUSLY
//    * 1. Check/Create PNC
//    * 2. Create Penalty Invoice (buyer) or Bill Credit (supplier)
//    */
//   private async processPenaltyAsync(penalty: Penalty): Promise<void> {
//     try {
//       this.logger.log(`🔄 Starting async penalty processing: ${penalty._id}`);

//       // STEP 1: Check if PNC exists in NetSuite
//       penalty.processingStatus = 'pnc_checking';
//       await penalty.save();

//       const pncResult = await this.checkOrCreatePNC(penalty);
      
//       penalty.pnc = {
//         pncId: pncResult.pncId,
//         existsInNetSuite: pncResult.existsInNetSuite,
//         createdByScript: pncResult.createdBy,
//         createdAt: new Date(),
//         invoiceId: penalty.invoiceId,
//         installmentNumber: penalty.installmentNumber,
//         paymentDocumentNo: penalty.customerPaymentId,
//         installmentDueDate: penalty.milestoneDueDate,
//         paymentDate: penalty.paymentDate,
//         tradeNumber: penalty.tradeNumber,
//         paidAmount: penalty.paidAmount,
//         paymentAmountExclTax: this.calculateAmountExclTax(penalty),
//         collectableDate: penalty.collectableDate,
//         calcDays: penalty.calcDays,
//       };

//       penalty.processingStatus = 'pnc_created';
//       await penalty.save();

//       // STEP 2: Create Penalty Invoice or Bill Credit
//       penalty.processingStatus = 'penalty_creating';
//       await penalty.save();

//       if (penalty.originationType === 'buyer') {
//         await this.createPenaltyInvoice(penalty);
//       } else {
//         await this.createPenaltyBillCredit(penalty);
//       }

//       penalty.processingStatus = 'completed';
//       penalty.processedAt = new Date();
//       await penalty.save();

//       this.logger.log(`✅ Penalty processing completed: ${penalty._id}`);
//     } catch (error: any) {
//       penalty.processingStatus = 'failed';
//       penalty.processingError = error.message;
//       penalty.retryCount += 1;
//       penalty.lastRetryAt = new Date();
//       await penalty.save();

//       this.logger.error(`❌ Penalty processing failed: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * CHECK OR CREATE PNC IN NETSUITE
//    */
//   private async checkOrCreatePNC(penalty: Penalty): Promise<any> {
//     try {
//       // Use checkAndSyncPNC operation from the main RESTlet
//       const syncPayload = {
//         operation: 'checkAndSyncPNC',
//         paymentId: penalty.customerPaymentId,
//         invoiceId: penalty.invoiceId,
//         installmentNum: penalty.installmentNumber,
//         dueDate: this.formatDateForNetSuite(penalty.milestoneDueDate),
//         paymentDate: this.formatDateForNetSuite(penalty.paymentDate),
//         paidAmount: penalty.paidAmount,
//         paidAmountExclTax: this.calculateAmountExclTax(penalty),
//         tradeNumber: penalty.tradeNumber,
//         collectableDate: penalty.collectableDate ? this.formatDateForNetSuite(penalty.collectableDate) : null,
//       };

//       const syncResponse = await this.netsuiteService.managePenalty(syncPayload);

//       if (syncResponse.success) {
//         this.logger.log(`✅ PNC synced: ${syncResponse.pncId}`);
//         return {
//           pncId: syncResponse.pncId,
//           existsInNetSuite: syncResponse.exists,
//           createdBy: syncResponse.created ? 'middleware' : 'netsuite_script',
//         };
//       } else {
//         throw new Error(syncResponse.error || 'PNC sync failed');
//       }
//     } catch (error: any) {
//       this.logger.error(`❌ PNC check/create failed: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * CREATE PENALTY INVOICE (BUYER ORIGINATED)
//    */
//   private async createPenaltyInvoice(penalty: Penalty): Promise<void> {
//     try {
//       // Call the dedicated penalty invoice RESTlet
//       const createPayload = {
//         operation: 'createPenaltyInvoice',
//         pncId: penalty.pnc.pncId,
//       };

//       const createResponse = await this.netsuiteService.createPenaltyInvoice(createPayload);

//       if (createResponse.success) {
//         penalty.penaltyInvoice = {
//           penaltyInvoiceId: createResponse.penaltyInvoiceId,
//           created: !createResponse.alreadyExists,
//           penaltyInvoiceNumber: createResponse.penaltyInvoiceNumber,
//           totalAmount: createResponse.totalAmount,
//           taxAmount: createResponse.taxAmount,
//           lineItems: [],
//           createdAt: new Date(),
//           createdBy: createResponse.alreadyExists ? 'netsuite_script' : 'middleware',
//           status: 'created',
//           errorMessage: '',
//         };
//         await penalty.save();

//         this.logger.log(`✅ Penalty invoice ${createResponse.alreadyExists ? 'exists' : 'created'}: ${createResponse.penaltyInvoiceId}`);
//       } else {
//         throw new Error(createResponse.error || 'Penalty invoice creation failed');
//       }
//     } catch (error: any) {
//       penalty.penaltyInvoice = {
//         created: false,
//         status: 'failed',
//         errorMessage: error.message,
//       } as any;
//       await penalty.save();

//       this.logger.error(`❌ Penalty invoice creation failed: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * CHECK OR CREATE BILL CREDIT DOCUMENT
//    */
//   private async checkOrCreateBillCreditDoc(penalty: Penalty): Promise<any> {
//     try {
//       // Use checkAndSyncBillCredit operation
//       const syncPayload = {
//         operation: 'checkAndSyncBillCredit',
//         paymentId: penalty.customerPaymentId,
//         invoiceId: penalty.invoiceId,
//         installmentNum: penalty.installmentNumber,
//         dueDate: this.formatDateForNetSuite(penalty.milestoneDueDate),
//         paymentDate: this.formatDateForNetSuite(penalty.paymentDate),
//         paidAmount: penalty.paidAmount,
//         tradeNumber: penalty.tradeNumber,
//         collectableDate: penalty.collectableDate ? this.formatDateForNetSuite(penalty.collectableDate) : null,
//         graceDate: penalty.graceDate ? this.formatDateForNetSuite(penalty.graceDate) : null,
//         milestoneDueAmount: penalty.milestoneDueAmount,
//         gstRetention: penalty.gstRetention,
//         taxTotal: penalty.taxTotal,
//       };

//       const syncResponse = await this.netsuiteService.managePenalty(syncPayload);

//       if (syncResponse.success) {
//         this.logger.log(`✅ Bill Credit Document synced: ${syncResponse.billCreditId}`);
//         return {
//           billCreditDocId: syncResponse.billCreditId,
//           existsInNetSuite: syncResponse.exists,
//           createdBy: syncResponse.created ? 'middleware' : 'netsuite_script',
//         };
//       } else {
//         throw new Error(syncResponse.error || 'Bill Credit Document sync failed');
//       }
//     } catch (error: any) {
//       this.logger.error(`❌ Bill Credit Document check/create failed: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * CREATE PENALTY BILL CREDIT (SUPPLIER ORIGINATED)
//    */
//   private async createPenaltyBillCredit(penalty: Penalty): Promise<void> {
//     try {
//       // First create/sync Bill Credit Document
//       const bcDoc = await this.checkOrCreateBillCreditDoc(penalty);

//       // Call the dedicated penalty bill credit RESTlet
//       const createPayload = {
//         operation: 'createPenaltyBillCredit',
//         billCreditDocId: bcDoc.billCreditDocId,
//       };

//       const createResponse = await this.netsuiteService.createPenaltyBillCredit(createPayload);

//       if (createResponse.success) {
//         penalty.penaltyBillCredit = {
//           billCreditId: createResponse.billCreditId,
//           created: !createResponse.alreadyExists,
//           billCreditNumber: createResponse.billCreditNumber,
//           totalAmount: createResponse.totalAmount,
//           taxAmount: createResponse.taxAmount,
//           lineItems: [],
//           createdAt: new Date(),
//           createdBy: createResponse.alreadyExists ? 'netsuite_script' : 'middleware',
//           status: 'created',
//           errorMessage: '',
//           derivedAnnualMargin: 0,
//           contractedMargin: 0,
//           creditPeriodDays: 0,
//         };
//         await penalty.save();

//         this.logger.log(`✅ Bill credit ${createResponse.alreadyExists ? 'exists' : 'created'}: ${createResponse.billCreditId}`);
//       } else {
//         throw new Error(createResponse.error || 'Bill credit creation failed');
//       }
//     } catch (error: any) {
//       penalty.penaltyBillCredit = {
//         created: false,
//         status: 'failed',
//         errorMessage: error.message,
//       } as any;
//       await penalty.save();

//       this.logger.error(`❌ Bill credit creation failed: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * HELPER: Calculate penalty line items
//    */
//   private calculatePenaltyLineItems(
//     lineItems: any[],
//     appliedAmount: number,
//     totalAmount: number,
//     penalInterest: number,
//     calcDays: number,
//     gstRetention: boolean,
//   ): any[] {
//     const penaltyItems: any[] = [];

//     for (const item of lineItems) {
//       const appliedRatio = appliedAmount / totalAmount;
//       const penaltyAmount = (appliedRatio * item.amount * penalInterest * calcDays) / 36500;

//       penaltyItems.push({
//         lineNumber: item.line,
//         item: item.itemId,
//         itemDisplay: item.itemName,
//         itemAmount: item.amount,
//         itemHsnCode: item.hsnCode,
//         taxRate: item.taxRate,
//         igstRate: item.igstRate,
//         cgstRate: item.cgstRate,
//         sgstRate: item.sgstRate,
//         penaltyAmount,
//         adjustedAmount: appliedRatio * item.amount,
//         appliedRatio,
//       });
//     }

//     return penaltyItems;
//   }

//   /**
//    * HELPER: Calculate amount excluding tax
//    */
//   private calculateAmountExclTax(penalty: Penalty): number {
//     if (penalty.gstRetention && penalty.taxTotal) {
//       const taxRate = penalty.taxTotal / (penalty.invoiceAmount - penalty.taxTotal);
//       return penalty.paidAmount / (1 + taxRate);
//     }
//     return penalty.paidAmount;
//   }

//   /**
//    * HELPER: Calculate margins for bill credit
//    */
//   private calculateMargins(penalty: Penalty, billDetails: any): any {
//     const invoiceTotal = penalty.invoiceGrossAmount;
//     const billTotal = billDetails.total;
//     const creditPeriodDays = penalty.supplierPaymentDays || 0;
    
//     const derivedAnnualMargin = 
//       ((invoiceTotal - billTotal) / billTotal / (creditPeriodDays + penalty.calcDays)) * 365 * 100;

//     return {
//       derivedAnnualMargin: derivedAnnualMargin.toFixed(2),
//       contractedMargin: penalty.contractedMargin || 0,
//       creditPeriodDays,
//     };
//   }

//   /**
//    * HELPER: Determine origination type
//    */
//   private determineOriginationType(invoiceDetails: any): string {
//     return invoiceDetails.transactionOrigin === 1 ? 'buyer' : 'supplier';
//   }

//   /**
//    * HELPER: Check penalty eligibility
//    */
//   private checkPenaltyEligibility(paymentDate: string, invoiceDetails: any, bill: any): any {
//     const utrDate = new Date(paymentDate);
//     const dueDate = new Date(invoiceDetails.dueDate);
    
//     const diffTime = utrDate.getTime() - dueDate.getTime();
//     const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

//     const isEligible = diffDays > 0 && invoiceDetails.supplierPaymentDate;

//     return {
//       isEligible,
//       isDueDateCrossed: diffDays > 0,
//       calcDays: Math.max(0, diffDays),
//       dueDate,
//       graceDate: invoiceDetails.graceDate,
//       collectableDate: invoiceDetails.collectableDate,
//       milestoneDueAmount: invoiceDetails.milestoneDueAmount,
//       reason: isEligible 
//         ? 'Eligible for penalty' 
//         : diffDays <= 0 
//         ? 'Payment within due date' 
//         : 'Missing supplier payment date',
//     };
//   }

//   /**
//    * HELPER: Parse date string from DD/MM/YYYY or ISO format
//    */
//   private parseDate(dateStr: string): Date {
//     if (!dateStr) return new Date();
    
//     // Check if it's DD/MM/YYYY or DD/M/YYYY format
//     if (dateStr.includes('/')) {
//       const parts = dateStr.split('/');
//       if (parts.length === 3) {
//         // DD/MM/YYYY or DD/M/YYYY
//         const day = parseInt(parts[0], 10);
//         const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
//         const year = parseInt(parts[2], 10);
        
//         // Validate the parsed values
//         if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
//           return new Date(year, month, day);
//         }
//       }
//     }
    
//     // Otherwise try ISO format
//     const isoDate = new Date(dateStr);
//     if (!isNaN(isoDate.getTime())) {
//       return isoDate;
//     }
    
//     // If all else fails, return current date
//     this.logger.warn(`⚠️ Could not parse date: ${dateStr}, using current date`);
//     return new Date();
//   }

//   /**
//    * HELPER: Format date for NetSuite (DD/MM/YYYY)
//    */
//   private formatDateForNetSuite(date: Date): string {
//     if (!date) return '';
    
//     const d = new Date(date);
//     const day = String(d.getDate()).padStart(2, '0');
//     const month = String(d.getMonth() + 1).padStart(2, '0');
//     const year = d.getFullYear();
    
//     return `${day}/${month}/${year}`;
//   }

//   /**
//    * HELPER: Fetch invoice details from NetSuite
//    */
//   private async fetchInvoiceDetails(invoiceId: string): Promise<any> {
//     const payload = {
//       operation: 'getInvoiceDetails',
//       invoiceId,
//     };
    
//     return await this.netsuiteService.managePenalty(payload);
//   }

//   /**
//    * HELPER: Fetch bill details from NetSuite
//    */
//   private async fetchBillDetails(billId: string): Promise<any> {
//     const payload = {
//       operation: 'getBillDetails',
//       billId,
//     };
    
//     return await this.netsuiteService.managePenalty(payload);
//   }

//   /**
//    * GET PENALTY BY ID
//    */
//   async getById(penaltyId: string): Promise<Penalty | null> {
//     return await this.penaltyModel.findById(penaltyId);
//   }

//   /**
//    * GET ALL PENALTIES
//    */
//   async getAll(limit: number = 100): Promise<Penalty[]> {
//     return await this.penaltyModel
//       .find()
//       .sort({ createdAt: -1 })
//       .limit(limit);
//   }

//   /**
//    * GET PENALTIES BY PAYMENT ID
//    */
//   async getByPaymentId(paymentId: string): Promise<Penalty[]> {
//     return await this.penaltyModel
//       .find({ customerPaymentId: paymentId })
//       .sort({ createdAt: -1 });
//   }

//   /**
//    * GET PENALTIES BY INVOICE ID
//    */
//   async getByInvoiceId(invoiceId: string): Promise<Penalty[]> {
//     return await this.penaltyModel
//       .find({ invoiceId })
//       .sort({ createdAt: -1 });
//   }
// }