// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { InvoicePenalty, InvoicePenaltyDocument } from '../schemas/invoice-penalty.schema';
// import { NetsuiteService } from '../../netsuite/services/netsuite.service';

// interface BackdatedPaymentData {
//   invoice_id: string;
//   actual_payment_date: string;
//   payment_amount: number;
//   penal_accrual_clear?: 'Yes' | 'No';
//   penal_accrual_amount?: number;
// }

// @Injectable()
// export class BackdatedAdjustmentService {
//   private readonly logger = new Logger(BackdatedAdjustmentService.name);

//   constructor(
//     @InjectModel(InvoicePenalty.name)
//     private invoicePenaltyModel: Model<InvoicePenaltyDocument>,
//     private readonly netsuiteService: NetsuiteService,
//   ) {}

//   /**
//    * Parse NetSuite date format (DD/MM/YYYY) to JavaScript Date
//    */
//   private parseNetSuiteDate(dateStr: string): Date | null {
//     if (!dateStr) {
//       return null;
//     }

//     try {
//       // Check if already ISO format
//       if (dateStr.includes('T') || dateStr.includes('-')) {
//         const date = new Date(dateStr);
//         if (!isNaN(date.getTime())) {
//           return date;
//         }
//       }

//       // Parse DD/MM/YYYY format
//       const parts = dateStr.split('/');
//       if (parts.length === 3) {
//         const day = parseInt(parts[0], 10);
//         const month = parseInt(parts[1], 10) - 1;
//         const year = parseInt(parts[2], 10);
        
//         const date = new Date(year, month, day);
//         if (!isNaN(date.getTime())) {
//           return date;
//         }
//       }

//       this.logger.warn(`Could not parse date: ${dateStr}`);
//       return null;
//     } catch (error) {
//       this.logger.error(`Error parsing date ${dateStr}:`, error.message);
//       return null;
//     }
//   }

//   /**
//    * Determine if invoice is supplier originated
//    */
//   private isSupplierOriginated(transactionOrigin?: string): boolean {
//     if (!transactionOrigin) return false;
    
//     const supplierOriginValues = [
//       'supplier',
//       'Supplier',
//       'SUPPLIER',
//       'Supplier Originated',
//       'supplier_originated',
//       '2'
//     ];
    
//     return supplierOriginValues.includes(transactionOrigin);
//   }

//   /**
//    * Calculate adjusted payment amount for supplier originated invoices with GST retention
//    */
//   private calculateAdjustedPaymentAmount(
//     paymentAmount: number,
//     trackingDoc: InvoicePenaltyDocument,
//     currentOutstanding: number,
//     newOutstanding: number,
//   ): number {
//     if (!this.isSupplierOriginated(trackingDoc.transaction_origin)) {
//       this.logger.log(`Buyer originated - using full payment amount: ₹${paymentAmount}`);
//       return paymentAmount;
//     }

//     if (!trackingDoc.gst_retention) {
//       this.logger.log(`Supplier originated but no GST retention - using full payment amount: ₹${paymentAmount}`);
//       return paymentAmount;
//     }

//     const invoiceTax = trackingDoc.invoice_tax_amount || 0;
//     const remainingAmount = newOutstanding;
    
//     let adjustedPayment = paymentAmount;
    
//     if (remainingAmount === 0) {
//       adjustedPayment = paymentAmount - invoiceTax;
//       this.logger.log(
//         `Supplier originated + GST retention + Full settlement | ` +
//         `Original: ₹${paymentAmount} | Tax: ₹${invoiceTax} | Adjusted: ₹${adjustedPayment}`
//       );
//     }
//     else if (remainingAmount < invoiceTax) {
//       const taxAdjustment = invoiceTax - remainingAmount;
//       adjustedPayment = paymentAmount - taxAdjustment;
//       this.logger.log(
//         `Supplier originated + GST retention + Partial settlement | ` +
//         `Original: ₹${paymentAmount} | Remaining: ₹${remainingAmount} | ` +
//         `Tax: ₹${invoiceTax} | Tax Adjustment: ₹${taxAdjustment} | Adjusted: ₹${adjustedPayment}`
//       );
//     }
//     else {
//       this.logger.log(
//         `Supplier originated + GST retention + Regular payment | ` +
//         `Remaining: ₹${remainingAmount} >= Tax: ₹${invoiceTax} | No adjustment needed`
//       );
//     }

//     return adjustedPayment;
//   }

//   /**
//    * Handle back-dated payment - Recalculate penalties from payment date to sync date
//    */
//   private async handleBackDatedPayment(
//     trackingDoc: InvoicePenaltyDocument,
//     paymentDate: Date,
//     syncDate: Date,
//     originalPaymentAmount: number,
//     newOutstanding: number,
//   ) {
//     this.logger.log(
//       `🔄 RECALCULATING BACK-DATED PAYMENT | ` +
//       `Invoice: ${trackingDoc.invoice_id} | ` +
//       `Payment: ₹${originalPaymentAmount} | ` +
//       `Payment Date: ${paymentDate.toDateString()} | ` +
//       `Sync Date: ${syncDate.toDateString()}`
//     );
    
//     const dueDate = new Date(trackingDoc.due_date);
//     dueDate.setHours(0, 0, 0, 0);
    
//     // STEP 1: Remove daily penalties AFTER payment date (including payment date)
//     const dailyPenaltiesBeforePayment = trackingDoc.daily_penalties.filter(dp => {
//       const dpDate = new Date(dp.date);
//       dpDate.setHours(0, 0, 0, 0);
//       return dpDate < paymentDate;
//     });
    
//     const removedPenalties = trackingDoc.daily_penalties.filter(dp => {
//       const dpDate = new Date(dp.date);
//       dpDate.setHours(0, 0, 0, 0);
//       return dpDate >= paymentDate;
//     });
    
//     this.logger.log(
//       `Removed ${removedPenalties.length} penalties from ${paymentDate.toDateString()} onwards | ` +
//       `Kept ${dailyPenaltiesBeforePayment.length} penalties before payment`
//     );
    
//     // STEP 2: Reset accrued penalty to what it was BEFORE payment date
//     const accruedBeforePayment = dailyPenaltiesBeforePayment.length > 0
//       ? dailyPenaltiesBeforePayment[dailyPenaltiesBeforePayment.length - 1].cumulative_penalty
//       : 0;
    
//     trackingDoc.daily_penalties = dailyPenaltiesBeforePayment;
//     trackingDoc.current_accrued_penalty = accruedBeforePayment;
    
//     this.logger.log(`Reset accrued penalty to: ₹${accruedBeforePayment}`);
    
//     // STEP 3: Calculate penalty on payment day using OLD outstanding
//     const oldOutstanding = trackingDoc.current_outstanding;
//     const dailyPenaltyOnPaymentDay = (oldOutstanding * (trackingDoc.penalty_rate / 100)) / 365;
//     const roundedDailyPaymentDay = Math.round(dailyPenaltyOnPaymentDay * 100) / 100;
    
//     // Add payment day penalty using OLD outstanding
//     trackingDoc.current_accrued_penalty = Math.round(
//       (trackingDoc.current_accrued_penalty + roundedDailyPaymentDay) * 100
//     ) / 100;
    
//     trackingDoc.daily_penalties.push({
//       date: new Date(
//         paymentDate.getFullYear(),
//         paymentDate.getMonth(),
//         paymentDate.getDate(),
//         0, 0, 0, 0
//       ),
//       principal_amount: oldOutstanding,
//       daily_penalty: roundedDailyPaymentDay,
//       cumulative_penalty: trackingDoc.current_accrued_penalty,
//       is_invoiced: false,
//     });
    
//     this.logger.log(
//       `Payment day (${paymentDate.toDateString()}) penalty: ` +
//       `₹${oldOutstanding} × ${trackingDoc.penalty_rate}% / 365 = ₹${roundedDailyPaymentDay}`
//     );
    
//     // STEP 4: Adjust payment amount for GST retention
//     const adjustedPaymentAmount = this.calculateAdjustedPaymentAmount(
//       originalPaymentAmount,
//       trackingDoc,
//       trackingDoc.current_outstanding,
//       newOutstanding,
//     );
    
//     // STEP 5: Calculate penalty on payment from due date to payment date
//     const daysOverdueAtPayment = Math.floor(
//       (paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
//     );
    
//     const dailyRateOnPayment = (adjustedPaymentAmount * (trackingDoc.penalty_rate / 100)) / 365;
//     const roundedDailyRate = Math.round(dailyRateOnPayment * 100) / 100;
//     const penaltyOnPayment = Math.round(roundedDailyRate * daysOverdueAtPayment * 100) / 100;
    
//     this.logger.log(
//       `Penalty on Payment (Due → Payment) | ` +
//       `${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdueAtPayment} = ₹${penaltyOnPayment}`
//     );
    
//     // STEP 6: Generate penalty invoice for payment
//     const penaltyInvoiceId = `PENAL-${trackingDoc.invoice_id}-${Date.now()}`;
    
//     trackingDoc.penalty_invoices.push({
//       penalty_invoice_id: penaltyInvoiceId,
//       amount: penaltyOnPayment,
//       generated_date: paymentDate,
//       period_from: dueDate,
//       period_to: paymentDate,
//       payment_amount: adjustedPaymentAmount,
//       original_payment_amount: originalPaymentAmount,
//       days_overdue: daysOverdueAtPayment,
//       calculation_formula: `${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdueAtPayment}`,
//       transaction_origin: trackingDoc.transaction_origin,
//       gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
//       status: 'CALCULATED',
//     });
    
//     // STEP 7: Deduct penalty from accrued
//     trackingDoc.current_accrued_penalty = Math.max(
//       0,
//       Math.round((trackingDoc.current_accrued_penalty - penaltyOnPayment) * 100) / 100
//     );
    
//     this.logger.log(
//       `Accrued after payment penalty deduction: ₹${penaltyOnPayment} deducted | ` +
//       `Remaining: ₹${trackingDoc.current_accrued_penalty}`
//     );
    
//     // STEP 8: Recalculate daily penalties from day AFTER payment to sync date
//     const daysToRecalculate = Math.floor(
//       (syncDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
//     );
    
//     this.logger.log(
//       `Recalculating penalties from ${paymentDate.toDateString()} + 1 to ${syncDate.toDateString()} | ` +
//       `Days: ${daysToRecalculate} | ` +
//       `New Outstanding: ₹${newOutstanding}`
//     );
    
//     // Recalculate day by day from day AFTER payment to sync date
//     for (let i = 1; i <= daysToRecalculate; i++) {
//       const currentDate = new Date(
//         paymentDate.getFullYear(),
//         paymentDate.getMonth(),
//         paymentDate.getDate() + i,
//         0, 0, 0, 0
//       );
      
//       const dailyPenalty = (newOutstanding * (trackingDoc.penalty_rate / 100)) / 365;
//       const roundedDaily = Math.round(dailyPenalty * 100) / 100;
      
//       trackingDoc.current_accrued_penalty = Math.round(
//         (trackingDoc.current_accrued_penalty + roundedDaily) * 100
//       ) / 100;
      
//       trackingDoc.daily_penalties.push({
//         date: currentDate,
//         principal_amount: newOutstanding,
//         daily_penalty: roundedDaily,
//         cumulative_penalty: trackingDoc.current_accrued_penalty,
//         is_invoiced: false,
//       });
//     }
    
//     this.logger.log(
//       `Recalculated ${daysToRecalculate} days | ` +
//       `Final Accrued: ₹${trackingDoc.current_accrued_penalty}`
//     );
    
//     // STEP 9: Update tracking document
//     trackingDoc.last_calculation_date = syncDate;
//     trackingDoc.last_payment_date = paymentDate;
    
//     trackingDoc.payment_history.push({
//       payment_date: paymentDate,
//       payment_type: 'PRINCIPAL_BACKDATED',
//       amount_paid: adjustedPaymentAmount,
//       original_amount_paid: originalPaymentAmount,
//       new_outstanding: newOutstanding,
//       penalty_invoice_generated: penaltyInvoiceId,
//       penalty_invoice_amount: penaltyOnPayment,
//       calculation: `BACK-DATED: ${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdueAtPayment} = ₹${penaltyOnPayment}`,
//       notes: `Payment ₹${originalPaymentAmount} (adjusted to ₹${adjustedPaymentAmount}) mapped on ${syncDate.toDateString()} but dated ${paymentDate.toDateString()}. Recalculated ${daysToRecalculate} days with new outstanding.`,
//       transaction_origin: trackingDoc.transaction_origin,
//       gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
//     });
    
//     this.logger.log(`✅ Back-dated payment processing complete`);
//   }

//   /**
//    * Process back-dated payment with explicit sync date (called by sync process)
//    */
//   async processBackdatedPaymentWithSyncDate(data: {
//     invoice_id: string;
//     actual_payment_date: string;
//     payment_amount: number;
//     sync_date: Date;
//     penal_accrual_clear?: 'Yes' | 'No';
//     penal_accrual_amount?: number;
//   }) {
//     this.logger.log(
//       `Sync-triggered back-dated payment processing | ` +
//       `Invoice: ${data.invoice_id} | ` +
//       `Payment Date: ${data.actual_payment_date} | ` +
//       `Sync Date: ${data.sync_date.toDateString()} | ` +
//       `Amount: ₹${data.payment_amount}`
//     );

//     const trackingDoc = await this.invoicePenaltyModel.findOne({
//       invoice_id: data.invoice_id,
//     });

//     if (!trackingDoc) {
//       throw new Error(`Invoice ${data.invoice_id} not found`);
//     }

//     const paymentDate = this.parseNetSuiteDate(data.actual_payment_date);
//     if (!paymentDate) {
//       throw new Error(`Invalid payment date: ${data.actual_payment_date}`);
//     }
//     paymentDate.setHours(0, 0, 0, 0);

//     const syncDate = new Date(data.sync_date);
//     syncDate.setHours(0, 0, 0, 0);

//     this.logger.log(
//       `✅ Parsed dates | ` +
//       `Payment: ${paymentDate.toDateString()} | ` +
//       `Sync: ${syncDate.toDateString()}`
//     );

//     const newOutstanding = trackingDoc.current_outstanding - data.payment_amount;

//     await this.handleBackDatedPayment(
//       trackingDoc,
//       paymentDate,
//       syncDate,  // ✅ Use passed sync date, not today
//       data.payment_amount,
//       newOutstanding,
//     );

//     if (data.penal_accrual_clear === 'Yes' && data.penal_accrual_amount) {
//       trackingDoc.current_accrued_penalty = Math.max(
//         0,
//         Math.round((trackingDoc.current_accrued_penalty - data.penal_accrual_amount) * 100) / 100
//       );
      
//       this.logger.log(`Additional accrued cleared: ₹${data.penal_accrual_amount}`);
//     }

//     trackingDoc.current_outstanding = newOutstanding;
//     trackingDoc.last_synced_from_netsuite = new Date();
    
//     if (trackingDoc.current_outstanding === 0) {
//       trackingDoc.status = 'CLOSED';
//     }
    
//     await trackingDoc.save();

//     return {
//       invoice_id: data.invoice_id,
//       invoice_number: trackingDoc.invoice_number,
//       payment_date: paymentDate,
//       payment_amount: data.payment_amount,
//       new_outstanding: trackingDoc.current_outstanding,
//       remaining_accrued: trackingDoc.current_accrued_penalty,
//       status: trackingDoc.status,
//       message: 'Back-dated payment processed successfully',
//     };
//   }

//   /**
//    * Process back-dated payment (manual endpoint - outside of NetSuite sync)
//    */
//   async processBackdatedPayment(data: BackdatedPaymentData) {
//     this.logger.log(
//       `Manual back-dated payment processing | ` +
//       `Invoice: ${data.invoice_id} | ` +
//       `Date: ${data.actual_payment_date} | ` +
//       `Amount: ₹${data.payment_amount}`
//     );

//     const trackingDoc = await this.invoicePenaltyModel.findOne({
//       invoice_id: data.invoice_id,
//     });

//     if (!trackingDoc) {
//       throw new Error(`Invoice ${data.invoice_id} not found`);
//     }

//     const paymentDate = this.parseNetSuiteDate(data.actual_payment_date);
//     if (!paymentDate) {
//       throw new Error(`Invalid payment date: ${data.actual_payment_date}`);
//     }
//     paymentDate.setHours(0, 0, 0, 0);

//     const syncDate = new Date();
//     syncDate.setHours(0, 0, 0, 0);

//     const newOutstanding = trackingDoc.current_outstanding - data.payment_amount;

//     await this.handleBackDatedPayment(
//       trackingDoc,
//       paymentDate,
//       syncDate,
//       data.payment_amount,
//       newOutstanding,
//     );

//     if (data.penal_accrual_clear === 'Yes' && data.penal_accrual_amount) {
//       trackingDoc.current_accrued_penalty = Math.max(
//         0,
//         Math.round((trackingDoc.current_accrued_penalty - data.penal_accrual_amount) * 100) / 100
//       );
      
//       this.logger.log(`Additional accrued cleared: ₹${data.penal_accrual_amount}`);
//     }

//     trackingDoc.current_outstanding = newOutstanding;
//     trackingDoc.last_synced_from_netsuite = new Date();
    
//     if (trackingDoc.current_outstanding === 0) {
//       trackingDoc.status = 'CLOSED';
//     }
    
//     await trackingDoc.save();

//     return {
//       invoice_id: data.invoice_id,
//       invoice_number: trackingDoc.invoice_number,
//       payment_date: paymentDate,
//       payment_amount: data.payment_amount,
//       new_outstanding: trackingDoc.current_outstanding,
//       remaining_accrued: trackingDoc.current_accrued_penalty,
//       status: trackingDoc.status,
//       message: 'Back-dated payment processed successfully',
//     };
//   }
// }


// UPDATED: backdated-adjustment.service.ts
// Changes made to match sync process behavior:
// 1. Save removed penalties before deleting (audit trail)
// 2. Match the exact penalty calculation logic from sync
// 3. Better logging for transparency

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvoicePenalty, InvoicePenaltyDocument } from '../schemas/invoice-penalty.schema';
import { NetsuiteService } from '../../netsuite/services/netsuite.service';

interface BackdatedPaymentData {
  invoice_id: string;
  actual_payment_date: string;
  payment_amount: number;
  penal_accrual_clear?: 'Yes' | 'No';
  penal_accrual_amount?: number;
}

@Injectable()
export class BackdatedAdjustmentService {
  private readonly logger = new Logger(BackdatedAdjustmentService.name);

  constructor(
    @InjectModel(InvoicePenalty.name)
    private invoicePenaltyModel: Model<InvoicePenaltyDocument>,
    private readonly netsuiteService: NetsuiteService,
  ) {}

  /**
   * Parse NetSuite date format (DD/MM/YYYY) to JavaScript Date
   */
  private parseNetSuiteDate(dateStr: string): Date | null {
    if (!dateStr) {
      return null;
    }

    try {
      // Check if already ISO format
      if (dateStr.includes('T') || dateStr.includes('-')) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Parse DD/MM/YYYY format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      this.logger.warn(`Could not parse date: ${dateStr}`);
      return null;
    } catch (error) {
      this.logger.error(`Error parsing date ${dateStr}:`, error.message);
      return null;
    }
  }

  /**
   * Determine if invoice is supplier originated
   */
  private isSupplierOriginated(transactionOrigin?: string): boolean {
    if (!transactionOrigin) return false;
    
    const supplierOriginValues = [
      'supplier',
      'Supplier',
      'SUPPLIER',
      'Supplier Originated',
      'supplier_originated',
      '2'
    ];
    
    return supplierOriginValues.includes(transactionOrigin);
  }

  /**
   * Calculate adjusted payment amount for supplier originated invoices with GST retention
   */
  private calculateAdjustedPaymentAmount(
    paymentAmount: number,
    trackingDoc: InvoicePenaltyDocument,
    currentOutstanding: number,
    newOutstanding: number,
  ): number {
    if (!this.isSupplierOriginated(trackingDoc.transaction_origin)) {
      this.logger.log(`Buyer originated - using full payment amount: ₹${paymentAmount}`);
      return paymentAmount;
    }

    if (!trackingDoc.gst_retention) {
      this.logger.log(`Supplier originated but no GST retention - using full payment amount: ₹${paymentAmount}`);
      return paymentAmount;
    }

    const invoiceTax = trackingDoc.invoice_tax_amount || 0;
    const remainingAmount = newOutstanding;
    
    let adjustedPayment = paymentAmount;
    
    if (remainingAmount === 0) {
      adjustedPayment = paymentAmount - invoiceTax;
      this.logger.log(
        `Supplier originated + GST retention + Full settlement | ` +
        `Original: ₹${paymentAmount} | Tax: ₹${invoiceTax} | Adjusted: ₹${adjustedPayment}`
      );
    }
    else if (remainingAmount < invoiceTax) {
      const taxAdjustment = invoiceTax - remainingAmount;
      adjustedPayment = paymentAmount - taxAdjustment;
      this.logger.log(
        `Supplier originated + GST retention + Partial settlement | ` +
        `Original: ₹${paymentAmount} | Remaining: ₹${remainingAmount} | ` +
        `Tax: ₹${invoiceTax} | Tax Adjustment: ₹${taxAdjustment} | Adjusted: ₹${adjustedPayment}`
      );
    }
    else {
      this.logger.log(
        `Supplier originated + GST retention + Regular payment | ` +
        `Remaining: ₹${remainingAmount} >= Tax: ₹${invoiceTax} | No adjustment needed`
      );
    }

    return adjustedPayment;
  }

  /**
   * Format date for NetSuite (DD/MM/YYYY)
   */
  private formatDateForNetSuite(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Handle back-dated payment - Recalculate penalties from payment date to sync date
   */
  private async handleBackDatedPayment(
    trackingDoc: InvoicePenaltyDocument,
    paymentDate: Date,
    syncDate: Date,
    originalPaymentAmount: number,
    newOutstanding: number,
     penalAccrualClear?: 'Yes' | 'No',
  ) {
    this.logger.log(
      `🔄 RECALCULATING BACK-DATED PAYMENT | ` +
      `Invoice: ${trackingDoc.invoice_id} | ` +
      `Payment: ₹${originalPaymentAmount} | ` +
      `Payment Date: ${paymentDate.toDateString()} | ` +
      `Sync Date: ${syncDate.toDateString()}`
    );
    
    const dueDate = new Date(trackingDoc.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    // ✅ STEP 1: Save removed penalties for audit trail
    const removedPenalties = trackingDoc.daily_penalties.filter(dp => {
      const dpDate = new Date(dp.date);
      dpDate.setHours(0, 0, 0, 0);
      return dpDate >= paymentDate;
    });
    
    this.logger.log(
      `📋 Audit Trail: Saving ${removedPenalties.length} penalties that will be recalculated:`
    );
    removedPenalties.forEach(dp => {
      this.logger.log(
        `  ${new Date(dp.date).toDateString()}: ` +
        `Principal: ₹${dp.principal_amount} | ` +
        `Daily: ₹${dp.daily_penalty} | ` +
        `Cumulative: ₹${dp.cumulative_penalty}`
      );
    });
    
    // ✅ STEP 2: Keep only penalties BEFORE payment date
    const dailyPenaltiesBeforePayment = trackingDoc.daily_penalties.filter(dp => {
      const dpDate = new Date(dp.date);
      dpDate.setHours(0, 0, 0, 0);
      return dpDate < paymentDate;
    });
    
    this.logger.log(
      `Keeping ${dailyPenaltiesBeforePayment.length} penalties before ${paymentDate.toDateString()}`
    );
    
    // ✅ STEP 3: Reset accrued penalty to what it was BEFORE payment date
    const accruedBeforePayment = dailyPenaltiesBeforePayment.length > 0
      ? dailyPenaltiesBeforePayment[dailyPenaltiesBeforePayment.length - 1].cumulative_penalty
      : 0;
    
    trackingDoc.daily_penalties = dailyPenaltiesBeforePayment;
    trackingDoc.current_accrued_penalty = accruedBeforePayment;
    
    this.logger.log(
      `✅ Reset accrued to day BEFORE payment (${paymentDate.toDateString()}): ₹${accruedBeforePayment}`
    );
    
    // ✅ STEP 4: Calculate penalty on payment day using OLD outstanding
    const oldOutstanding = trackingDoc.current_outstanding;
    const dailyPenaltyOnPaymentDay = (oldOutstanding * (trackingDoc.penalty_rate / 100)) / 365;
    const roundedDailyPaymentDay = Math.round(dailyPenaltyOnPaymentDay * 100) / 100;
    
    // Add payment day penalty using OLD outstanding
    trackingDoc.current_accrued_penalty = Math.round(
      (trackingDoc.current_accrued_penalty + roundedDailyPaymentDay) * 100
    ) / 100;
    
    trackingDoc.daily_penalties.push({
      date: new Date(
        paymentDate.getFullYear(),
        paymentDate.getMonth(),
        paymentDate.getDate(),
        0, 0, 0, 0
      ),
      principal_amount: oldOutstanding,
      daily_penalty: roundedDailyPaymentDay,
      cumulative_penalty: trackingDoc.current_accrued_penalty,
      is_invoiced: false,
    });
    
    this.logger.log(
      `✅ Payment day (${paymentDate.toDateString()}) penalty added | ` +
      `Using OLD outstanding: ₹${oldOutstanding} | ` +
      `Daily penalty: ₹${roundedDailyPaymentDay} | ` +
      `Cumulative: ₹${trackingDoc.current_accrued_penalty}`
    );
    
    // ✅ STEP 5: Adjust payment amount for GST retention
    const adjustedPaymentAmount = this.calculateAdjustedPaymentAmount(
      originalPaymentAmount,
      trackingDoc,
      trackingDoc.current_outstanding,
      newOutstanding,
    );
    
    // ✅ STEP 6: Calculate penalty on payment from due date to payment date
    const daysOverdueAtPayment = Math.floor(
      (paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const dailyRateOnPayment = (adjustedPaymentAmount * (trackingDoc.penalty_rate / 100)) / 365;
    const roundedDailyRate = Math.round(dailyRateOnPayment * 100) / 100;
    const penaltyOnPayment = Math.round(roundedDailyRate * daysOverdueAtPayment * 100) / 100;
    
    this.logger.log(
      `Penalty on Payment calculation | ` +
      `Payment: ₹${adjustedPaymentAmount} (original: ₹${originalPaymentAmount}) | ` +
      `Days overdue (Due → Payment): ${daysOverdueAtPayment} | ` +
      `Formula: ${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdueAtPayment} = ₹${penaltyOnPayment}`
    );
    
    // ✅ STEP 7: Handle penalty - either create invoice OR just deduct
let netsuiteInvoiceId: string | null = null;
const penaltyInvoiceId = `PENAL-BACKDATED-${trackingDoc.invoice_id}-${Date.now()}`;

if (penalAccrualClear === 'No') {
  // CASE 1: User NOT paying penalty - just deduct from accrued
  this.logger.log(`⏭️ SKIPPING penalty invoice creation - User is NOT paying penalty (penal_accrual_clear: No)`);
  
  const accruedBeforeDeduction = trackingDoc.current_accrued_penalty;
  trackingDoc.current_accrued_penalty = Math.max(
    0,
    Math.round((trackingDoc.current_accrued_penalty - penaltyOnPayment) * 100) / 100
  );
  
  this.logger.log(
    `✅ Accrued penalty deduction (no invoice) | ` +
    `Before: ₹${accruedBeforeDeduction} | ` +
    `Penalty: ₹${penaltyOnPayment} | ` +
    `After: ₹${trackingDoc.current_accrued_penalty}`
  );
  
} else {
  // CASE 2: User IS paying penalty - create invoice
  try {
    const isBuyerOriginated = !this.isSupplierOriginated(trackingDoc.transaction_origin);
    
    if (isBuyerOriginated) {
      this.logger.log(`Creating penalty invoice in NetSuite (Buyer Originated) | Amount: ₹${penaltyOnPayment}`);
      
      const netsuiteResult = await this.netsuiteService.createBackendPenaltyInvoice({
        customer_id: trackingDoc.customer_id,
        original_invoice_number: trackingDoc.invoice_number,
        penalty_amount: penaltyOnPayment,
        period_from: this.formatDateForNetSuite(dueDate),
        period_to: this.formatDateForNetSuite(paymentDate),
        utr_reference: '',
        memo: `Back-dated penalty for ${trackingDoc.invoice_number} - Payment on ${paymentDate.toDateString()}`,
      });
      
      netsuiteInvoiceId = netsuiteResult.invoice_id;
      this.logger.log(`✅ NetSuite penalty invoice created: ${netsuiteInvoiceId}`);
      
    } else {
      this.logger.log(`Supplier originated - penalty bill credit creation not yet implemented`);
    }
    
  } catch (netsuiteError) {
    this.logger.error(
      `❌ NetSuite penalty invoice creation FAILED | ` +
      `Error: ${netsuiteError.message} | ` +
      `⚠️ ABORTING recalculation to maintain data consistency`
    );
    
    throw new Error(
      `Failed to create penalty invoice in NetSuite: ${netsuiteError.message}. ` +
      `Back-dated payment processing aborted.`
    );
  }
  
  // ✅ STEP 8: Generate penalty invoice record in MongoDB (only if NetSuite succeeded)
  trackingDoc.penalty_invoices.push({
    penalty_invoice_id: penaltyInvoiceId,
    amount: penaltyOnPayment,
    generated_date: paymentDate,
    period_from: dueDate,
    period_to: paymentDate,
    payment_amount: adjustedPaymentAmount,
    original_payment_amount: originalPaymentAmount,
    days_overdue: daysOverdueAtPayment,
    calculation_formula: `${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdueAtPayment}`,
    transaction_origin: trackingDoc.transaction_origin,
    gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
    status: 'CALCULATED',
    netsuite_invoice_id: netsuiteInvoiceId || undefined,
  });
  
  // ✅ STEP 9: Deduct penalty from accrued
  const accruedBeforeDeduction = trackingDoc.current_accrued_penalty;
  trackingDoc.current_accrued_penalty = Math.max(
    0,
    Math.round((trackingDoc.current_accrued_penalty - penaltyOnPayment) * 100) / 100
  );
  
  this.logger.log(
    `✅ Accrued penalty deduction | ` +
    `Before: ₹${accruedBeforeDeduction} | ` +
    `Penalty: ₹${penaltyOnPayment} | ` +
    `After: ₹${trackingDoc.current_accrued_penalty}`
  );
  
  // Mark daily penalties up to payment date as invoiced
  trackingDoc.daily_penalties.forEach(dp => {
    const dpDate = new Date(dp.date);
    dpDate.setHours(0, 0, 0, 0);
    
    if (dpDate >= dueDate && dpDate <= paymentDate && !dp.is_invoiced) {
      dp.is_invoiced = true;
      dp.penalty_invoice_ref = penaltyInvoiceId;
      dp.penalty_invoice_amount = penaltyOnPayment;
      dp.accrued_after_deduction = trackingDoc.current_accrued_penalty;
    }
  });
}

// ✅ STEP 10: Recalculate daily penalties (ALWAYS happens, regardless of penalty payment)
const daysToRecalculate = Math.floor(
  (syncDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
);

this.logger.log(
  `📊 Recalculating penalties | ` +
  `From: ${paymentDate.toDateString()} + 1 day | ` +
  `To: ${syncDate.toDateString()} | ` +
  `Days: ${daysToRecalculate} | ` +
  `New Outstanding: ₹${newOutstanding}`
);

// ... rest of recalculation code
    
    // Recalculate day by day from day AFTER payment to sync date
    for (let i = 1; i <= daysToRecalculate; i++) {
      const currentDate = new Date(
        paymentDate.getFullYear(),
        paymentDate.getMonth(),
        paymentDate.getDate() + i,
        0, 0, 0, 0
      );
      
      const dailyPenalty = (newOutstanding * (trackingDoc.penalty_rate / 100)) / 365;
      const roundedDaily = Math.round(dailyPenalty * 100) / 100;
      
      trackingDoc.current_accrued_penalty = Math.round(
        (trackingDoc.current_accrued_penalty + roundedDaily) * 100
      ) / 100;
      
      trackingDoc.daily_penalties.push({
        date: currentDate,
        principal_amount: newOutstanding,
        daily_penalty: roundedDaily,
        cumulative_penalty: trackingDoc.current_accrued_penalty,
        is_invoiced: false,
      });
      
      this.logger.log(
        `  ${currentDate.toDateString()}: ` +
        `Outstanding: ₹${newOutstanding} | ` +
        `Daily: ₹${roundedDaily} | ` +
        `Cumulative: ₹${trackingDoc.current_accrued_penalty}`
      );
    }
    
    this.logger.log(
      `✅ Recalculation complete | ` +
      `Final Accrued: ₹${trackingDoc.current_accrued_penalty}`
    );
    
    // ✅ STEP 11: Update tracking document
    trackingDoc.last_calculation_date = syncDate;
    trackingDoc.last_payment_date = paymentDate;
    
    trackingDoc.payment_history.push({
      payment_date: paymentDate,
      payment_type: 'PRINCIPAL_BACKDATED',
      amount_paid: adjustedPaymentAmount,
      original_amount_paid: originalPaymentAmount,
      new_outstanding: newOutstanding,
      penalty_invoice_generated: penaltyInvoiceId,
      penalty_invoice_amount: penaltyOnPayment,
      calculation: `BACK-DATED: ${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdueAtPayment} = ₹${penaltyOnPayment}`,
      notes: `Payment ₹${originalPaymentAmount} (adjusted to ₹${adjustedPaymentAmount}) mapped on ${syncDate.toDateString()} but dated ${paymentDate.toDateString()}. Recalculated ${daysToRecalculate} days with new outstanding ₹${newOutstanding}. NetSuite Invoice: ${netsuiteInvoiceId || 'N/A'}`,
      transaction_origin: trackingDoc.transaction_origin,
      gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
    });
    
    this.logger.log(`✅ Back-dated payment processing complete`);
  }


  /**
   * Process back-dated payment with explicit sync date (called by sync process)
   */
  async processBackdatedPaymentWithSyncDate(data: {
    invoice_id: string;
    actual_payment_date: string;
    payment_amount: number;
    sync_date: Date;
    penal_accrual_clear?: 'Yes' | 'No';
    penal_accrual_amount?: number;
  }) {
    this.logger.log(
      `Sync-triggered back-dated payment processing | ` +
      `Invoice: ${data.invoice_id} | ` +
      `Payment Date: ${data.actual_payment_date} | ` +
      `Sync Date: ${data.sync_date.toDateString()} | ` +
      `Amount: ₹${data.payment_amount}`
    );

    const trackingDoc = await this.invoicePenaltyModel.findOne({
      invoice_id: data.invoice_id,
    });

    if (!trackingDoc) {
      throw new Error(`Invoice ${data.invoice_id} not found`);
    }

    const paymentDate = this.parseNetSuiteDate(data.actual_payment_date);
    if (!paymentDate) {
      throw new Error(`Invalid payment date: ${data.actual_payment_date}`);
    }
    paymentDate.setHours(0, 0, 0, 0);

    const syncDate = new Date(data.sync_date);
    syncDate.setHours(0, 0, 0, 0);

    this.logger.log(
      `✅ Parsed dates | ` +
      `Payment: ${paymentDate.toDateString()} | ` +
      `Sync: ${syncDate.toDateString()}`
    );

    const newOutstanding = trackingDoc.current_outstanding - data.payment_amount;

    await this.handleBackDatedPayment(
      trackingDoc,
      paymentDate,
      syncDate,  // ✅ Use passed sync date, not today
      data.payment_amount,
      newOutstanding,
       data.penal_accrual_clear,
    );

    if (data.penal_accrual_clear === 'Yes' && data.penal_accrual_amount) {
      const clearedAmount = data.penal_accrual_amount;
      trackingDoc.current_accrued_penalty = Math.max(
        0,
        Math.round((trackingDoc.current_accrued_penalty - clearedAmount) * 100) / 100
      );
      
      this.logger.log(
        `Additional accrued cleared | ` +
        `Amount: ₹${clearedAmount} | ` +
        `Remaining: ₹${trackingDoc.current_accrued_penalty}`
      );
    }

    trackingDoc.current_outstanding = newOutstanding;
    trackingDoc.last_synced_from_netsuite = new Date();
    
    if (trackingDoc.current_outstanding === 0) {
      trackingDoc.status = 'CLOSED';
    }
    
    await trackingDoc.save();

    return {
      invoice_id: data.invoice_id,
      invoice_number: trackingDoc.invoice_number,
      payment_date: paymentDate,
      payment_amount: data.payment_amount,
      new_outstanding: trackingDoc.current_outstanding,
      remaining_accrued: trackingDoc.current_accrued_penalty,
      status: trackingDoc.status,
      message: 'Back-dated payment processed successfully',
    };
  }

  /**
   * Process back-dated payment (manual endpoint - outside of NetSuite sync)
   */
  async processBackdatedPayment(data: BackdatedPaymentData) {
    this.logger.log(
      `Manual back-dated payment processing | ` +
      `Invoice: ${data.invoice_id} | ` +
      `Date: ${data.actual_payment_date} | ` +
      `Amount: ₹${data.payment_amount}`
    );

    const trackingDoc = await this.invoicePenaltyModel.findOne({
      invoice_id: data.invoice_id,
    });

    if (!trackingDoc) {
      throw new Error(`Invoice ${data.invoice_id} not found`);
    }

    const paymentDate = this.parseNetSuiteDate(data.actual_payment_date);
    if (!paymentDate) {
      throw new Error(`Invalid payment date: ${data.actual_payment_date}`);
    }
    paymentDate.setHours(0, 0, 0, 0);

    const syncDate = new Date();
    syncDate.setHours(0, 0, 0, 0);

    const newOutstanding = trackingDoc.current_outstanding - data.payment_amount;

    await this.handleBackDatedPayment(
      trackingDoc,
      paymentDate,
      syncDate,
      data.payment_amount,
      newOutstanding,
       data.penal_accrual_clear,
    );

    if (data.penal_accrual_clear === 'Yes' && data.penal_accrual_amount) {
      const clearedAmount = data.penal_accrual_amount;
      trackingDoc.current_accrued_penalty = Math.max(
        0,
        Math.round((trackingDoc.current_accrued_penalty - clearedAmount) * 100) / 100
      );
      
      this.logger.log(
        `Additional accrued cleared | ` +
        `Amount: ₹${clearedAmount} | ` +
        `Remaining: ₹${trackingDoc.current_accrued_penalty}`
      );
    }

    trackingDoc.current_outstanding = newOutstanding;
    trackingDoc.last_synced_from_netsuite = new Date();
    
    if (trackingDoc.current_outstanding === 0) {
      trackingDoc.status = 'CLOSED';
    }
    
    await trackingDoc.save();

    return {
      invoice_id: data.invoice_id,
      invoice_number: trackingDoc.invoice_number,
      payment_date: paymentDate,
      payment_amount: data.payment_amount,
      new_outstanding: trackingDoc.current_outstanding,
      remaining_accrued: trackingDoc.current_accrued_penalty,
      status: trackingDoc.status,
      message: 'Back-dated payment processed successfully',
    };
  }
}