import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvoicePenalty, InvoicePenaltyDocument } from '../schemas/invoice-penalty.schema';
import { NetsuiteService } from '../../netsuite/services/netsuite.service';
import { BackdatedAdjustmentService } from './backdated-adjustment.service';  

interface InvoiceSyncData {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  original_amount: number;
  outstanding_amount: number;
  transaction_date: string;
  due_date: string;
  penalty_rate: number;
  last_modified: string;
  transaction_origin?: string;
  gst_retention?: boolean;
  invoice_tax_amount?: number;
  actual_payment_date?: string;
  all_payment_dates?: Array<{
    date: string;
    number: string;
    amount: number;
  }>;
}

interface SyncResults {
  processed: number;
  payments_detected: number;
  penalty_amount_calculated: number;
  errors: number;
  error_details: Array<{
    invoice_id: string;
    error: string;
  }>;
}

@Injectable()
export class PenaltiesService {
  private readonly logger = new Logger(PenaltiesService.name);

  constructor(
    @InjectModel(InvoicePenalty.name)
    private invoicePenaltyModel: Model<InvoicePenaltyDocument>,
      private readonly netsuiteService: NetsuiteService,
       private readonly backdatedAdjustmentService: BackdatedAdjustmentService,
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
   * Parse ISO date string and return the DATE only (ignoring time/timezone)
   */
  private parseISODateOnly(dateStr: string): Date {
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    return localDate;
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
   * Detect new payments by comparing NetSuite data with payment history
   */
  private detectNewPayments(
    allPaymentDates: Array<{ date: string; number: string; amount: number }>,
    paymentHistory: Array<{ payment_date: Date; payment_type: string }>,
  ): Array<{ date: Date; number: string; amount: number }> {
    if (!allPaymentDates || allPaymentDates.length === 0) {
      return [];
    }

    const newPayments: Array<{ date: Date; number: string; amount: number }> = [];

    for (const nsPayment of allPaymentDates) {
      const paymentDate = this.parseNetSuiteDate(nsPayment.date);
      if (!paymentDate) {
        this.logger.warn(`Could not parse payment date: ${nsPayment.date}`);
        continue;
      }
      paymentDate.setHours(0, 0, 0, 0);

      // Check if this payment already exists in our history
      const existsInHistory = paymentHistory.some(ph => {
        const phDate = new Date(ph.payment_date);
        phDate.setHours(0, 0, 0, 0);
        return phDate.getTime() === paymentDate.getTime();
      });

      if (!existsInHistory) {
        newPayments.push({
          date: paymentDate,
          number: nsPayment.number,
          amount: nsPayment.amount,
        });
        
        this.logger.log(
          ` NEW PAYMENT DETECTED | ` +
          `Date: ${paymentDate.toDateString()} | ` +
          `Number: ${nsPayment.number} | ` +
          `Amount: ₹${nsPayment.amount}`
        );
      }
    }

    return newPayments;
  }

  /**
   * Main sync function called by NetSuite cron job
   */
  async syncFromNetSuite(payload: { sync_date: string; invoices: InvoiceSyncData[] }) {
    const syncDate = this.parseISODateOnly(payload.sync_date);
    
    this.logger.log(
      `Starting sync for ${payload.invoices.length} invoices | ` +
      `Sync Date (Received): ${payload.sync_date} | ` +
      `Sync Date (Parsed): ${syncDate.toDateString()} ${syncDate.toLocaleString()}`
    );
    
    const results: SyncResults = {
      processed: 0,
      payments_detected: 0,
      penalty_amount_calculated: 0,
      errors: 0,
      error_details: [],
    };

    for (const invoiceData of payload.invoices) {
      try {
        await this.processInvoice(invoiceData, results, syncDate);
        results.processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error processing invoice ${invoiceData.invoice_id}:`, errorMessage);
        results.errors++;
        results.error_details.push({
          invoice_id: invoiceData.invoice_id,
          error: errorMessage,
        });
      }
    }

    this.logger.log(`Sync complete: ${JSON.stringify(results)}`);
    return results;
  }

  /**
   * Process single invoice
   */
 private async processInvoice(invoiceData: InvoiceSyncData, results: SyncResults, today: Date) {
    const existingDoc = await this.invoicePenaltyModel.findOne({
      invoice_id: invoiceData.invoice_id,
    });

    if (!existingDoc) {
      const newDoc = await this.createNewTrackingDoc(invoiceData);
      this.logger.log(`Created new tracking for invoice: ${invoiceData.invoice_id}`);
      
      await this.calculateInitialPenalties(newDoc, invoiceData, today);
      
      await newDoc.save();
      return;
    }

    const trackingDoc = existingDoc;

    //  Detect new payments using all_payment_dates array
   
//  CRITICAL CHECK: Skip if already processed today
// ✅ CRITICAL CHECK: Skip if already processed today (moved to BEFORE payment detection)
const lastCalcDate = trackingDoc.last_calculation_date;
if (lastCalcDate) {
  const lastCalc = new Date(lastCalcDate);
  lastCalc.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  if (lastCalc.getTime() === today.getTime()) {
    this.logger.log(
      `⏭️ SKIPPING: Already processed today | ` +
      `Invoice: ${invoiceData.invoice_id} | ` +
      `Last calc: ${lastCalc.toDateString()} | ` +
      `Sync date: ${today.toDateString()}`
    );
    
    // Just update sync timestamp
    trackingDoc.last_synced_from_netsuite = new Date();
    await trackingDoc.save();
    return;
  }
}

// ✅ Detect new payments using all_payment_dates array
const newPayments = this.detectNewPayments(
  invoiceData.all_payment_dates || [],
  trackingDoc.payment_history || [],
);

// ✅ Process new payments if any
if (newPayments.length > 0) {
  for (const payment of newPayments) {
    const paymentDate = payment.date;
    paymentDate.setHours(0, 0, 0, 0);

    // Check if back-dated
    if (paymentDate < today) {
      this.logger.warn(
        `⚠️ BACK-DATED PAYMENT DETECTED | ` +
        `Payment Date: ${paymentDate.toDateString()} | ` +
        `Sync Date: ${today.toDateString()} | ` +
        `Auto-calling backdated adjustment service...`
      );
      
      // ✅ AUTO-CALL BACKDATED SERVICE
      try {
        const paymentAmount = trackingDoc.current_outstanding - invoiceData.outstanding_amount;
        
        // Format date as DD/MM/YYYY (NetSuite format)
        const day = String(paymentDate.getDate()).padStart(2, '0');
        const month = String(paymentDate.getMonth() + 1).padStart(2, '0');
        const year = paymentDate.getFullYear();
        const formattedPaymentDate = `${day}/${month}/${year}`;
        
        this.logger.log(
          `Calling backdated service | ` +
          `Payment Date: ${formattedPaymentDate} | ` +
          `Sync Date: ${today.toDateString()} | ` +
          `Amount: ₹${paymentAmount}`
        );
        
        await this.backdatedAdjustmentService.processBackdatedPaymentWithSyncDate({
          invoice_id: invoiceData.invoice_id,
          actual_payment_date: formattedPaymentDate,
          payment_amount: paymentAmount,
          sync_date: today,
        });
        
        this.logger.log(`✅ Backdated payment processed successfully`);
        results.payments_detected++;
        
        // Reload the updated document
        const updatedDoc = await this.invoicePenaltyModel.findOne({
          invoice_id: invoiceData.invoice_id,
        });
        
        if (updatedDoc) {
          Object.assign(trackingDoc, updatedDoc);
        }
        
      } catch (error) {
        this.logger.error(
          `❌ Failed to process backdated payment: ${error.message}`
        );
      }
      
      continue;
    }

    // Same-day payment - process normally
    this.logger.log(`✅ SAME-DAY PAYMENT | Processing...`);
    
    // Calculate today's penalty FIRST (using OLD outstanding)
    await this.calculateDailyPenalty(trackingDoc, trackingDoc.current_outstanding, today);
    
    // Process payment
    const paymentAmount = trackingDoc.current_outstanding - invoiceData.outstanding_amount;
    await this.processNormalPayment(
      trackingDoc,
      invoiceData,
      paymentDate,
      paymentAmount,
      results,
    );
  }
} else {
  // No new payments - just calculate daily penalty
  await this.calculateDailyPenalty(trackingDoc, trackingDoc.current_outstanding, today);
}

    // Check if invoice fully paid
    if (invoiceData.outstanding_amount === 0) {
      await this.handleFullPayment(trackingDoc, today);
    }

    // Save document
    trackingDoc.current_outstanding = invoiceData.outstanding_amount;
    trackingDoc.last_synced_from_netsuite = new Date();
    await trackingDoc.save();
  }

  /**
   * Create new tracking document for first-time overdue invoice
   */
  private async createNewTrackingDoc(invoiceData: InvoiceSyncData): Promise<InvoicePenaltyDocument> {
    const transactionDate = this.parseNetSuiteDate(invoiceData.transaction_date);
    const dueDate = this.parseNetSuiteDate(invoiceData.due_date);

    if (!dueDate) {
      throw new Error(`Invalid due_date for invoice ${invoiceData.invoice_id}: ${invoiceData.due_date}`);
    }

    const newDoc = new this.invoicePenaltyModel({
      invoice_id: invoiceData.invoice_id,
      invoice_number: invoiceData.invoice_number,
      customer_id: invoiceData.customer_id,
      customer_name: invoiceData.customer_name,
      original_amount: invoiceData.original_amount,
      current_outstanding: invoiceData.outstanding_amount,
      spd: transactionDate || dueDate,
      due_date: dueDate,
      penalty_rate: invoiceData.penalty_rate,
      status: 'OVERDUE',
      current_accrued_penalty: 0,
      penalty_invoices: [],
      daily_penalties: [],
      payment_history: [],
      last_synced_from_netsuite: new Date(),
      transaction_origin: invoiceData.transaction_origin,
      gst_retention: invoiceData.gst_retention || false,
      invoice_tax_amount: invoiceData.invoice_tax_amount || 0,
    });

    return newDoc;
  }

  /**
   * Calculate penalties for all overdue days when first tracking invoice
   * FIXED: Proper date creation to avoid timezone shifts
   */
  private async calculateInitialPenalties(
    trackingDoc: InvoicePenaltyDocument,
    invoiceData: InvoiceSyncData,
    today: Date,
  ) {
    const dueDate = new Date(trackingDoc.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOverdue <= 0) {
      this.logger.log(`Invoice ${invoiceData.invoice_id} not yet overdue`);
      return;
    }

    this.logger.log(`Invoice ${invoiceData.invoice_id} is ${daysOverdue} days overdue. Calculating penalties...`);

    const dailyPenalty = (invoiceData.outstanding_amount * (trackingDoc.penalty_rate / 100)) / 365;
    const roundedDaily = Math.round(dailyPenalty * 100) / 100;

    let cumulativePenalty = 0;
    
    for (let i = 1; i <= daysOverdue; i++) {
      // FIXED: Create date properly to avoid timezone shifts
      const penaltyDate = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate() + i,
        0, 0, 0, 0
      );
      
      cumulativePenalty += roundedDaily;
      
      trackingDoc.daily_penalties.push({
        date: penaltyDate,
        principal_amount: invoiceData.outstanding_amount,
        daily_penalty: roundedDaily,
        cumulative_penalty: Math.round(cumulativePenalty * 100) / 100,
        is_invoiced: false,
      });
    }

    trackingDoc.current_accrued_penalty = Math.round(cumulativePenalty * 100) / 100;
    trackingDoc.last_calculation_date = today;

    this.logger.log(`Initial penalty calculated: ₹${roundedDaily}/day × ${daysOverdue} days = ₹${trackingDoc.current_accrued_penalty}`);
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
   * Process normal payment (same day as sync)
   */
 private async processNormalPayment(
  trackingDoc: InvoicePenaltyDocument,
  invoiceData: InvoiceSyncData,
  paymentDate: Date,
  originalPaymentAmount: number,
  results: SyncResults,
) {
  const adjustedPaymentAmount = this.calculateAdjustedPaymentAmount(
    originalPaymentAmount,
    trackingDoc,
    trackingDoc.current_outstanding,
    invoiceData.outstanding_amount,
  );
  
  const dueDate = new Date(trackingDoc.due_date);
  dueDate.setHours(0, 0, 0, 0);
  
  const daysOverdue = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const dailyRateOnPayment = (adjustedPaymentAmount * (trackingDoc.penalty_rate / 100)) / 365;
  const roundedDailyRate = Math.round(dailyRateOnPayment * 100) / 100;
  const roundedPenalty = Math.round(roundedDailyRate * daysOverdue * 100) / 100;
  
  this.logger.log(
    `Penalty calculation: ${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdue} = ₹${roundedPenalty}`
  );
  
  const currentAccrued = trackingDoc.current_accrued_penalty;
  const penaltyInvoiceId = `PENAL-${invoiceData.invoice_id}-${Date.now()}`;
  
  //  TRANSACTION SAFETY: Create penalty invoice in NetSuite FIRST
  let netsuiteInvoiceId: string | null = null;
  
  try {
    const isBuyerOriginated = !this.isSupplierOriginated(trackingDoc.transaction_origin);
    
    if (isBuyerOriginated) {
      this.logger.log(`Creating penalty invoice in NetSuite (Buyer Originated) | Amount: ₹${roundedPenalty}`);
      
      const netsuiteResult = await this.netsuiteService.createBackendPenaltyInvoice({
        customer_id: invoiceData.customer_id,
        original_invoice_number: trackingDoc.invoice_number,
        penalty_amount: roundedPenalty,
        period_from: this.formatDateForNetSuite(dueDate),
        period_to: this.formatDateForNetSuite(paymentDate),
        utr_reference: '',
        memo: `Penalty for ${trackingDoc.invoice_number} - Payment on ${paymentDate.toDateString()}`,
      });
      
      netsuiteInvoiceId = netsuiteResult.invoice_id;
      this.logger.log(` NetSuite penalty invoice created: ${netsuiteInvoiceId}`);
      
    } else {
      this.logger.log(`Supplier originated - penalty bill credit creation not yet implemented`);
    }
    
  } catch (netsuiteError) {
    this.logger.error(
      ` NetSuite penalty invoice creation FAILED | ` +
      `Error: ${netsuiteError.message} | ` +
      ` ABORTING MongoDB update to maintain data consistency`
    );
    
    //  Do NOT update MongoDB if NetSuite fails
    throw new Error(
      `Failed to create penalty invoice in NetSuite: ${netsuiteError.message}. ` +
      `Payment processing aborted to prevent data inconsistency.`
    );
  }
  
  //  ONLY UPDATE MONGODB IF NETSUITE SUCCEEDED
  this.logger.log(` NetSuite success - Updating MongoDB...`);
  
  trackingDoc.penalty_invoices.push({
    penalty_invoice_id: penaltyInvoiceId,
    amount: roundedPenalty,
    generated_date: paymentDate,
    period_from: dueDate,
    period_to: paymentDate,
    payment_amount: adjustedPaymentAmount,
    original_payment_amount: originalPaymentAmount,
    days_overdue: daysOverdue,
    calculation_formula: `${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdue}`,
    transaction_origin: trackingDoc.transaction_origin,
    gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
    status: 'CALCULATED',
    netsuite_invoice_id: netsuiteInvoiceId || undefined,  //  Store NetSuite invoice ID
  });
  
  const newAccrued = currentAccrued - roundedPenalty;
  trackingDoc.current_accrued_penalty = Math.max(0, Math.round(newAccrued * 100) / 100);
  
  this.logger.log(
    `Accrued penalty deduction: ₹${currentAccrued} - ₹${roundedPenalty} = ₹${trackingDoc.current_accrued_penalty}`
  );
  
  trackingDoc.daily_penalties.forEach(dp => {
    const dpDate = new Date(dp.date);
    dpDate.setHours(0, 0, 0, 0);
    
    if (dpDate >= dueDate && dpDate <= paymentDate && !dp.is_invoiced) {
      dp.is_invoiced = true;
      dp.penalty_invoice_ref = penaltyInvoiceId;
      dp.penalty_invoice_amount = roundedPenalty;
      dp.accrued_after_deduction = trackingDoc.current_accrued_penalty;
    }
  });
  
  trackingDoc.payment_history.push({
    payment_date: paymentDate,
    payment_type: 'PRINCIPAL',
    amount_paid: adjustedPaymentAmount,
    original_amount_paid: originalPaymentAmount,
    new_outstanding: invoiceData.outstanding_amount,
    penalty_invoice_generated: penaltyInvoiceId,
    penalty_invoice_amount: roundedPenalty,
    calculation: `${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdue} = ₹${roundedPenalty}`,
    notes: `Payment ₹${originalPaymentAmount} (adjusted to ₹${adjustedPaymentAmount}) received. Penalty ₹${roundedPenalty} calculated and deducted from accrued. NetSuite Invoice: ${netsuiteInvoiceId || 'N/A'}`,
    transaction_origin: trackingDoc.transaction_origin,
    gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
  });
  
  trackingDoc.last_payment_date = paymentDate;
  trackingDoc.last_calculation_date = paymentDate;

  results.payments_detected++;
  results.penalty_amount_calculated += roundedPenalty;
  
  this.logger.log(` Payment processed successfully | MongoDB updated`);
}


  /**
   * Calculate and record daily penalty
   */
  private async calculateDailyPenalty(
    trackingDoc: InvoicePenaltyDocument,
    currentOutstanding: number,
    today: Date,
  ) {
    const lastCalcDate = trackingDoc.last_calculation_date;
    if (lastCalcDate) {
      const lastCalc = new Date(lastCalcDate);
      lastCalc.setHours(0, 0, 0, 0);
      if (lastCalc.getTime() === today.getTime()) {
        this.logger.debug(`Already calculated for today: ${trackingDoc.invoice_id}`);
        return;
      }
    }

    const dailyPenalty = (currentOutstanding * (trackingDoc.penalty_rate / 100)) / 365;
    const roundedDaily = Math.round(dailyPenalty * 100) / 100;
    
    const newCumulative = trackingDoc.current_accrued_penalty + roundedDaily;
    
    // FIXED: Create date properly
    trackingDoc.daily_penalties.push({
      date: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0, 0, 0, 0
      ),
      principal_amount: currentOutstanding,
      daily_penalty: roundedDaily,
      cumulative_penalty: Math.round(newCumulative * 100) / 100,
      is_invoiced: false,
    });
    
    trackingDoc.current_accrued_penalty = Math.round(newCumulative * 100) / 100;
    trackingDoc.last_calculation_date = today;
    
    this.logger.debug(`Daily penalty: ₹${roundedDaily}, Cumulative: ₹${trackingDoc.current_accrued_penalty}`);
  }

  /**
   * Handle full payment of invoice
   */
  private async handleFullPayment(
    trackingDoc: InvoicePenaltyDocument,
    today: Date,
  ) {
    this.logger.log(`Full payment detected for invoice: ${trackingDoc.invoice_id}`);
    
    if (trackingDoc.current_accrued_penalty > 0) {
      const finalPenaltyId = `PENAL-FINAL-${trackingDoc.invoice_id}-${Date.now()}`;
      
      const periodFrom = trackingDoc.last_payment_date 
        ? new Date(trackingDoc.last_payment_date) 
        : new Date(trackingDoc.due_date);

      trackingDoc.penalty_invoices.push({
        penalty_invoice_id: finalPenaltyId,
        amount: trackingDoc.current_accrued_penalty,
        generated_date: today,
        period_from: periodFrom,
        period_to: today,
        payment_amount: 0,
        days_overdue: 0,
        calculation_formula: 'Final accrued penalty on full payment',
        status: 'CALCULATED',
      });
      
      this.logger.log(`Final penalty amount: ₹${trackingDoc.current_accrued_penalty}`);
    }
    
    trackingDoc.status = 'CLOSED';
    trackingDoc.current_accrued_penalty = 0;
    
    this.logger.log(`Invoice closed: ${trackingDoc.invoice_id}`);
  }

  /**
   * Get invoice details for UI
   */
  async getInvoiceDetails(invoiceId: string) {
    const trackingDoc = await this.invoicePenaltyModel.findOne({
      invoice_id: invoiceId,
    });

    if (!trackingDoc) {
      throw new Error('Invoice not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentAccrued = trackingDoc.current_accrued_penalty;
    
    const lastCalcDate = trackingDoc.last_calculation_date 
      ? new Date(trackingDoc.last_calculation_date)
      : null;
    
    if (lastCalcDate) {
      lastCalcDate.setHours(0, 0, 0, 0);
      
      if (today > lastCalcDate) {
        const daysPending = Math.floor((today.getTime() - lastCalcDate.getTime()) / (1000 * 60 * 60 * 24));
        const dailyPenalty = (trackingDoc.current_outstanding * (trackingDoc.penalty_rate / 100)) / 365;
        currentAccrued += (dailyPenalty * daysPending);
      }
    }

    const dueDate = new Date(trackingDoc.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      invoice_id: trackingDoc.invoice_id,
      invoice_number: trackingDoc.invoice_number,
      customer_id: trackingDoc.customer_id,
      customer_name: trackingDoc.customer_name,
      original_amount: trackingDoc.original_amount,
      current_outstanding: trackingDoc.current_outstanding,
      due_date: trackingDoc.due_date,
      days_overdue: daysOverdue,
      penalty_rate: trackingDoc.penalty_rate,
      status: trackingDoc.status,
      current_accrued_penalty: trackingDoc.current_accrued_penalty,
      penalty_invoices: trackingDoc.penalty_invoices,
      daily_penalties: trackingDoc.daily_penalties,
      payment_history: trackingDoc.payment_history,
      last_calculation_date: trackingDoc.last_calculation_date,
      transaction_origin: trackingDoc.transaction_origin,
      gst_retention: trackingDoc.gst_retention,
      invoice_tax_amount: trackingDoc.invoice_tax_amount,
    };
  }

  /**
   * Get all overdue invoices for a customer
   */
  async getCustomerInvoices(customerId: string) {
    const invoices = await this.invoicePenaltyModel.find({
      customer_id: customerId,
      status: 'OVERDUE',
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return invoices.map(invoice => {
      let currentAccrued = invoice.current_accrued_penalty;
      
      const lastCalcDate = invoice.last_calculation_date 
        ? new Date(invoice.last_calculation_date)
        : null;
      
      if (lastCalcDate) {
        lastCalcDate.setHours(0, 0, 0, 0);
        
        if (today > lastCalcDate) {
          const daysPending = Math.floor((today.getTime() - lastCalcDate.getTime()) / (1000 * 60 * 60 * 24));
          const dailyPenalty = (invoice.current_outstanding * (invoice.penalty_rate / 100)) / 365;
          currentAccrued += (dailyPenalty * daysPending);
        }
      }

      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const totalPenaltyCalculated = invoice.penalty_invoices
        .reduce((sum, pi) => sum + pi.amount, 0);

      return {
        invoice_id: invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        original_amount: invoice.original_amount,
        current_outstanding: invoice.current_outstanding,
        due_date: invoice.due_date,
        days_overdue: daysOverdue,
        penalty_rate: invoice.penalty_rate,
        penalty_amounts_calculated: Math.round(totalPenaltyCalculated * 100) / 100,
        current_accrued_penalty: Math.round(currentAccrued * 100) / 100,
        total_penalty: Math.round((totalPenaltyCalculated + currentAccrued) * 100) / 100,
        transaction_origin: invoice.transaction_origin,
        gst_retention: invoice.gst_retention,
      };
    });
  }

  /**
   * Calculate prorated penalty for proposed payment (for preview/planning)
   */
  async calculateProratedPenalty(
    invoiceId: string,
    proposedPaymentAmount: number,
    paymentDate?: Date,
  ) {
    const trackingDoc = await this.invoicePenaltyModel.findOne({
      invoice_id: invoiceId,
    });

    if (!trackingDoc) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const today = paymentDate || new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(trackingDoc.due_date);
    dueDate.setHours(0, 0, 0, 0);

    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const adjustedPayment = this.calculateAdjustedPaymentAmount(
      proposedPaymentAmount,
      trackingDoc,
      trackingDoc.current_outstanding,
      trackingDoc.current_outstanding - proposedPaymentAmount,
    );

    const dailyRateOnPayment = (adjustedPayment * (trackingDoc.penalty_rate / 100)) / 365;
    const roundedDailyRate = Math.round(dailyRateOnPayment * 100) / 100;
    const penaltyOnPayment = Math.round(roundedDailyRate * daysOverdue * 100) / 100;

    let currentAccrued = trackingDoc.current_accrued_penalty;
    const lastCalcDate = trackingDoc.last_calculation_date
      ? new Date(trackingDoc.last_calculation_date)
      : null;

    if (lastCalcDate) {
      lastCalcDate.setHours(0, 0, 0, 0);
      if (today > lastCalcDate) {
        const daysPending = Math.floor((today.getTime() - lastCalcDate.getTime()) / (1000 * 60 * 60 * 24));
        const dailyPenalty = (trackingDoc.current_outstanding * (trackingDoc.penalty_rate / 100)) / 365;
        currentAccrued += Math.round(dailyPenalty * daysPending * 100) / 100;
      }
    }

    const remainingAccrued = Math.max(0, currentAccrued - penaltyOnPayment);
    const remainingOutstanding = trackingDoc.current_outstanding - proposedPaymentAmount;

    this.logger.log(
      `Prorated calculation: ` +
      `Payment: ₹${proposedPaymentAmount} (adjusted: ₹${adjustedPayment}) | ` +
      `Days: ${daysOverdue} | ` +
      `Penalty: ₹${penaltyOnPayment}`
    );

    return {
      invoice_id: invoiceId,
      invoice_number: trackingDoc.invoice_number,
      current_outstanding: trackingDoc.current_outstanding,
      proposed_payment_amount: proposedPaymentAmount,
      adjusted_payment_amount: adjustedPayment,
      days_overdue: daysOverdue,
      penalty_rate: trackingDoc.penalty_rate,
      penalty_on_payment: penaltyOnPayment,
      current_accrued_before_payment: Math.round(currentAccrued * 100) / 100,
      remaining_accrued_after_payment: Math.round(remainingAccrued * 100) / 100,
      remaining_outstanding: Math.round(remainingOutstanding * 100) / 100,
      total_accrued_including_today: Math.round(currentAccrued * 100) / 100,
      calculation_date: today,
      transaction_origin: trackingDoc.transaction_origin,
      gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
    };
  }

  /**
   * Reconcile payment with optional accrued penalty clearance
   */
  async reconcilePaymentWithAccrued(reconciliation: {
    invoice_number: string;
    outstanding_amount_for_recon: number;
    penal_accrual_clear: 'Yes' | 'No';
    penal_accrual_recon_amount?: number;
    payment_date?: string;
  }) {
    this.logger.log(`Reconciling invoice: ${reconciliation.invoice_number}`);

    const trackingDoc = await this.invoicePenaltyModel.findOne({
      invoice_number: reconciliation.invoice_number,
    });

    if (!trackingDoc) {
      throw new Error(`Invoice ${reconciliation.invoice_number} not found`);
    }

    const paymentDate = reconciliation.payment_date
      ? this.parseNetSuiteDate(reconciliation.payment_date) || new Date()
      : new Date();
    paymentDate.setHours(0, 0, 0, 0);

    const paymentAmount = trackingDoc.current_outstanding - reconciliation.outstanding_amount_for_recon;

    this.logger.log(
      `Payment: ₹${paymentAmount} | ` +
      `New Outstanding: ₹${reconciliation.outstanding_amount_for_recon} | ` +
      `Clear Accrued: ${reconciliation.penal_accrual_clear}`
    );

    trackingDoc.current_outstanding = reconciliation.outstanding_amount_for_recon;

    if (reconciliation.penal_accrual_clear === 'Yes') {
      const clearedAmount = reconciliation.penal_accrual_recon_amount || trackingDoc.current_accrued_penalty;
      
      this.logger.log(`Clearing accrued penalty: ₹${clearedAmount}`);
      
      const penaltyInvoiceId = `PENAL-RECON-${trackingDoc.invoice_id}-${Date.now()}`;
      
      trackingDoc.penalty_invoices.push({
        penalty_invoice_id: penaltyInvoiceId,
        amount: clearedAmount,
        generated_date: paymentDate,
        period_from: trackingDoc.last_payment_date || trackingDoc.due_date,
        period_to: paymentDate,
        payment_amount: paymentAmount,
        days_overdue: 0,
        calculation_formula: 'Manual reconciliation - accrued penalty cleared',
        status: 'CALCULATED',
      });
      
      trackingDoc.current_accrued_penalty = Math.max(
        0,
        Math.round((trackingDoc.current_accrued_penalty - clearedAmount) * 100) / 100
      );
    }

    if (reconciliation.outstanding_amount_for_recon === 0) {
      trackingDoc.status = 'CLOSED';
    }

    trackingDoc.last_payment_date = paymentDate;
trackingDoc.last_calculation_date = paymentDate; // ✅ ADD THIS LINE
trackingDoc.last_synced_from_netsuite = new Date();

await trackingDoc.save();

    this.logger.log(`Reconciliation complete for ${reconciliation.invoice_number}`);

    return {
      invoice_number: reconciliation.invoice_number,
      payment_amount: paymentAmount,
      new_outstanding: reconciliation.outstanding_amount_for_recon,
      accrued_cleared: reconciliation.penal_accrual_clear === 'Yes',
      cleared_amount: reconciliation.penal_accrual_clear === 'Yes' 
        ? reconciliation.penal_accrual_recon_amount || trackingDoc.current_accrued_penalty 
        : 0,
      remaining_accrued: trackingDoc.current_accrued_penalty,
      status: trackingDoc.status,
    };
  }

/**
 * Reconcile payment with UTR - handles principal and penalty
 * NOW DETECTS AND HANDLES BACKDATED PAYMENTS
 */
async reconcilePaymentWithUtr(data: {
  custid: string;
  paymentdate: string;
  sync_date?: string;
  utrno: string;
  memo: string;
  amount: number;
  invoices: Array<{
    invoiceId: string;
    amount: number;
    penal_accrual_clear?: 'Yes' | 'No';
    penal_accrual_recon_amount?: number;
  }>;
}) {
  this.logger.log(`Processing UTR reconciliation: ${data.utrno}`);
  
  // ✅ STEP 1: Parse payment date and check if backdated
  const parsedPaymentDate = this.parseNetSuiteDate(data.paymentdate);
  if (!parsedPaymentDate) {
    throw new Error(`Invalid payment date: ${data.paymentdate}`);
  }
  parsedPaymentDate.setHours(0, 0, 0, 0);
  
  const today = data.sync_date 
  ? this.parseISODateOnly(data.sync_date)
  : new Date();
today.setHours(0, 0, 0, 0);
  
  // ✅ STEP 2: If backdated, use backdated service instead
// ✅ STEP 2: If backdated, recalculate penalties first
let isBackdated = false;

if (parsedPaymentDate < today) {
  this.logger.warn(
    `⚠️ BACKDATED PAYMENT DETECTED VIA UTR | ` +
    `Payment Date: ${parsedPaymentDate.toDateString()} | ` +
    `Today: ${today.toDateString()} | ` +
    `Recalculating penalties first, then will create NetSuite payment...`
  );
  
  isBackdated = true;
  
  for (const inv of data.invoices) {
    try {
      if (inv.amount > 0) {
        this.logger.log(
          `Recalculating backdated penalties | ` +
          `Invoice: ${inv.invoiceId} | ` +
          `Amount: ₹${inv.amount}`
        );
        
        await this.backdatedAdjustmentService.processBackdatedPaymentWithSyncDate({
          invoice_id: inv.invoiceId,
          actual_payment_date: data.paymentdate,
          payment_amount: inv.amount,
          sync_date: today,
          penal_accrual_clear: inv.penal_accrual_clear,
          penal_accrual_amount: inv.penal_accrual_recon_amount,
        });
        
        this.logger.log(`✅ Backdated penalties recalculated for invoice ${inv.invoiceId}`);
      }
    } catch (error) {
      this.logger.error(
        `Error recalculating backdated penalties for invoice ${inv.invoiceId}: ${error.message}`
      );
      throw error;
    }
  }
  
  // ✅ DON'T RETURN - Continue to create NetSuite Customer Payment below
}

// ✅ STEP 3: Continue with regular flow - create NetSuite Customer Payment
this.logger.log(
  isBackdated 
    ? `Penalties recalculated. Now creating NetSuite Customer Payment...`
    : `Regular (same-day) payment | Payment Date: ${parsedPaymentDate.toDateString()} = Today`
);
  
  // ✅ STEP 3: If NOT backdated, continue with regular UTR flow
  this.logger.log(
    `Regular (same-day) payment | ` +
    `Payment Date: ${parsedPaymentDate.toDateString()} = Today`
  );
  
  // STEP 4: Separate principal and penalty invoices
  const principalInvoices: Array<{
    invoiceId: string;
    amount: number;
  }> = [];
  
  const penaltyInvoices: Array<{
    invoice_id: string;
    payment_amount: number;
    accrued_to_clear: number; 
    utrno: string;
  }> = [];
  
  data.invoices.forEach(inv => {
    // Only add to principal if amount > 0
    if (inv.amount > 0) {
      principalInvoices.push({
        invoiceId: inv.invoiceId,
        amount: inv.amount,
      });
    }
    
    // Track penalty if flag is set
    if (inv.penal_accrual_clear === 'Yes' && inv.penal_accrual_recon_amount) {
      penaltyInvoices.push({
        invoice_id: inv.invoiceId,
        payment_amount: inv.amount, 
        accrued_to_clear: inv.penal_accrual_recon_amount, 
        utrno: data.utrno,
      });
    }
  });
  
  this.logger.log(
    `Principal invoices: ${principalInvoices.length} | ` +
    `Penalty invoices: ${penaltyInvoices.length}`
  );
  
  let netsuiteResult: any = null;
  let netsuiteSuccess = false;
  
  // ONLY call NetSuite if there are principal payments
  if (principalInvoices.length > 0) {
    const netsuitePayload = {
      custid: data.custid,
      paymentdate: data.paymentdate,
      utrno: data.utrno,
      memo: data.memo || '',
      amount: data.amount,
      invoices: principalInvoices.map(inv => ({
        invoiceId: inv.invoiceId,
        total_amount: inv.amount,
        installments: [{
          intallment_ref_no: "1",
          amount: inv.amount
        }]
      })),
      skip_penalty_generation: penaltyInvoices.length > 0,
      penalty_handled_by_backend: penaltyInvoices.map(p => ({
        invoice_id: p.invoice_id,
        payment_amount: p.payment_amount,
        utr: p.utrno,
      })),
      meta_details: {
        initiation_type: "2",
        created_by_employee: "",
        email: "backend@tradenext.com",
        created_by_customer: data.custid,
        deviceType: "2"
      }
    };
    
    try {
      netsuiteResult = await this.callNetSuiteRestlet(netsuitePayload);
      netsuiteSuccess = true;
      this.logger.log(`✅ NetSuite principal reconciliation successful`);
    } catch (error) {
      this.logger.error('⚠️ NetSuite reconciliation failed:', error.message);
      this.logger.log('⚠️ Continuing with penalty clearance in MongoDB...');
      netsuiteResult = { error: error.message, failed: true };
    }
  } else {
    this.logger.log('⚠️ No principal payments - skipping NetSuite Customer Payment creation');
    netsuiteResult = { skipped: true, reason: 'No principal payments' };
  }
  
  // STEP 5: Process penalties ASYNCHRONOUSLY
  if (penaltyInvoices.length > 0) {
    this.logger.log(`Processing ${penaltyInvoices.length} penalty clearances asynchronously`);
    
    this.processPenaltyClearanceAsync(penaltyInvoices, data.custid, data.paymentdate)
      .catch(error => {
        this.logger.error('Async penalty processing error:', error.message);
      });
  }

  // ✅ UPDATE MONGODB IMMEDIATELY after NetSuite success
  if (netsuiteSuccess && principalInvoices.length > 0 && !isBackdated) {
    this.logger.log(`✅ Updating MongoDB for principal payments to prevent re-processing...`);
    
    const paymentDate = parsedPaymentDate;
    
    // Update each invoice that had principal payment
    for (const principalInv of principalInvoices) {
      try {
        const trackingDoc = await this.invoicePenaltyModel.findOne({
          invoice_id: principalInv.invoiceId,
        });
        
        if (!trackingDoc) {
          this.logger.warn(`Invoice ${principalInv.invoiceId} not found in tracking`);
          continue;
        }
        
        // ✅ STEP 1: Calculate and add daily penalty for payment day (if not already done)
        const lastCalcDate = trackingDoc.last_calculation_date;
        let dailyPenaltyAdded = false;
        
        if (!lastCalcDate || new Date(lastCalcDate).getTime() !== paymentDate.getTime()) {
          const dailyPenalty = (trackingDoc.current_outstanding * (trackingDoc.penalty_rate / 100)) / 365;
          const roundedDaily = Math.round(dailyPenalty * 100) / 100;
          
          trackingDoc.current_accrued_penalty = Math.round(
            (trackingDoc.current_accrued_penalty + roundedDaily) * 100
          ) / 100;
          
          trackingDoc.daily_penalties.push({
            date: new Date(
              paymentDate.getFullYear(),
              paymentDate.getMonth(),
              paymentDate.getDate(),
              0, 0, 0, 0
            ),
            principal_amount: trackingDoc.current_outstanding,
            daily_penalty: roundedDaily,
            cumulative_penalty: trackingDoc.current_accrued_penalty,
            is_invoiced: false,
          });
          
          dailyPenaltyAdded = true;
          
          this.logger.log(
            `✅ Added daily penalty for payment day | ` +
            `Date: ${paymentDate.toDateString()} | ` +
            `Penalty: ₹${roundedDaily} | ` +
            `Cumulative: ₹${trackingDoc.current_accrued_penalty}`
          );
        }
        
        // ✅ STEP 2: Calculate pro-rated penalty (for logging only)
        const dueDate = new Date(trackingDoc.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const adjustedPayment = this.calculateAdjustedPaymentAmount(
          principalInv.amount,
          trackingDoc,
          trackingDoc.current_outstanding,
          trackingDoc.current_outstanding - principalInv.amount,
        );
        
        const dailyRateOnPayment = (adjustedPayment * (trackingDoc.penalty_rate / 100)) / 365;
        const roundedDailyRate = Math.round(dailyRateOnPayment * 100) / 100;
        const proratedPenalty = Math.round(roundedDailyRate * daysOverdue * 100) / 100;
        
        this.logger.log(
          `Pro-rated penalty calculated | ` +
          `Payment: ₹${adjustedPayment} | Days: ${daysOverdue} | Penalty: ₹${proratedPenalty}`
        );
        
        // ✅ STEP 3: Check if user is paying penalty (Case 2) or not (Case 1)
        const penaltyInvForThis = penaltyInvoices.find(p => p.invoice_id === principalInv.invoiceId);
        
        if (penaltyInvForThis) {
          // ✅ CASE 2: User is paying penalty - async process will handle MongoDB update
          this.logger.log(
            `📌 CASE 2: Penalty payment detected | ` +
            `Amount to clear: ₹${penaltyInvForThis.accrued_to_clear} | ` +
            `Async process will update accrued | ` +
            `Current accrued (after daily add): ₹${trackingDoc.current_accrued_penalty}`
          );
          
          // ❌ DO NOT DEDUCT HERE - async process will do it after creating NetSuite invoice
          
        } else {
          // ✅ CASE 1: User NOT paying penalty - deduct pro-rated from accrued NOW
          const accruedBeforeDeduction = trackingDoc.current_accrued_penalty;
          
          trackingDoc.current_accrued_penalty = Math.max(
            0,
            Math.round((trackingDoc.current_accrued_penalty - proratedPenalty) * 100) / 100
          );
          
          this.logger.log(
            `✅ CASE 1: Principal only payment | ` +
            `Deducted pro-rated penalty: ₹${proratedPenalty} | ` +
            `Accrued: ₹${accruedBeforeDeduction} → ₹${trackingDoc.current_accrued_penalty}`
          );
        }
        
        // ✅ STEP 4: Record payment in history
        trackingDoc.payment_history.push({
          payment_date: paymentDate,
          payment_type: penaltyInvForThis ? 'PRINCIPAL_WITH_PENALTY_UTR' : 'PRINCIPAL_ONLY_UTR',
          amount_paid: adjustedPayment,
          original_amount_paid: principalInv.amount,
          new_outstanding: trackingDoc.current_outstanding - principalInv.amount,
          penalty_invoice_amount: penaltyInvForThis ? penaltyInvForThis.accrued_to_clear : proratedPenalty,
          calculation: `UTR: ${data.utrno} | ${penaltyInvForThis ? `User paying: ₹${penaltyInvForThis.accrued_to_clear}` : `Pro-rated deducted: ₹${proratedPenalty}`}`,
          notes: penaltyInvForThis 
            ? `Payment via UTR ${data.utrno} | Principal: ₹${principalInv.amount} | Penalty: ₹${penaltyInvForThis.accrued_to_clear} (user paying - async will process)`
            : `Payment via UTR ${data.utrno} | Principal: ₹${principalInv.amount} | Pro-rated deducted: ₹${proratedPenalty}`,
          transaction_origin: trackingDoc.transaction_origin,
          gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
        });
        
        // ✅ STEP 5: Update outstanding and dates
        trackingDoc.current_outstanding = trackingDoc.current_outstanding - principalInv.amount;
        trackingDoc.last_calculation_date = paymentDate;
        trackingDoc.last_payment_date = paymentDate;
        trackingDoc.last_synced_from_netsuite = new Date();
        
        await trackingDoc.save();
        
        this.logger.log(
          `✅ Invoice ${principalInv.invoiceId} updated | ` +
          `Outstanding: ₹${trackingDoc.current_outstanding} | ` +
          `Accrued: ₹${trackingDoc.current_accrued_penalty} | ` +
          `Last calc: ${paymentDate.toDateString()}`
        );
        
      } catch (error) {
        this.logger.error(
          `Error updating MongoDB for invoice ${principalInv.invoiceId}: ${error.message}`
        );
      }
    }
  }
  
  // STEP 6: Return immediately
  return {
    success: true,
    timestamp: new Date().toISOString(),
    principal_reconciliation: {
      status: principalInvoices.length > 0 
        ? (netsuiteSuccess ? 'COMPLETED' : 'FAILED')
        : 'SKIPPED_NO_PRINCIPAL',
      netsuite_response: netsuiteResult,
      invoices_reconciled: netsuiteSuccess ? principalInvoices.length : 0,
      error: netsuiteSuccess ? undefined : 'NetSuite call failed - check logs',
    },
    penalty_processing: {
      status: penaltyInvoices.length > 0 ? 'PROCESSING_IN_BACKGROUND' : 'NONE',
      penalty_invoices_count: penaltyInvoices.length,
    },
  };
}


/**
 * Call NetSuite Reconciliation RESTlet with OAuth
 */
private async callNetSuiteRestlet(payload: any): Promise<any> {
  this.logger.log(`Calling NetSuite reconciliation RESTlet`);
  
  try {
    // Use NetsuiteService which has proper OAuth
    const result = await this.netsuiteService.reconcilePaymentWithUTR(payload);
    
    this.logger.log(`NetSuite response: ${JSON.stringify(result)}`);
    return result;
    
  } catch (error) {
    this.logger.error('NetSuite RESTlet call failed:', error.message);
    throw error;
  }
}
private async processPenaltyClearanceAsync(
  penaltyInvoices: Array<{
    invoice_id: string;
    payment_amount: number;
    accrued_to_clear: number; 
    utrno: string;
  }>,
  customerId: string,
  paymentDate: string,
) {
  this.logger.log(`Background penalty clearance started`);
  
  //  ADD SMALL DELAY to ensure foreground process completes first
  await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
  
  for (const penaltyInv of penaltyInvoices) {
    try {
      this.logger.log(`Processing penalty for invoice: ${penaltyInv.invoice_id}`);
      
      // CRITICAL: RELOAD document to get latest values after foreground update
      const trackingDoc = await this.invoicePenaltyModel.findOne({
        invoice_id: penaltyInv.invoice_id,
      });
      
      if (!trackingDoc) {
        this.logger.warn(`Invoice ${penaltyInv.invoice_id} not found in penalty tracking`);
        continue;
      }
      
      this.logger.log(
        ` Document reloaded | ` +
        `Current accrued: ₹${trackingDoc.current_accrued_penalty} | ` +
        `Outstanding: ₹${trackingDoc.current_outstanding} | ` +
        `Last calc: ${trackingDoc.last_calculation_date ? new Date(trackingDoc.last_calculation_date).toDateString() : 'N/A'}`
      );
      
      const parsedPaymentDate = this.parseNetSuiteDate(paymentDate);
      const today = parsedPaymentDate || new Date();
      today.setHours(0, 0, 0, 0);
      
      const dueDate = new Date(trackingDoc.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get the CURRENT accrued (which should already include today's penalty from foreground)
      const currentAccruedBeforeDeduction = trackingDoc.current_accrued_penalty;
      
      this.logger.log(
        `Accrued penalty before user payment deduction: ₹${currentAccruedBeforeDeduction} | ` +
        `User is paying: ₹${penaltyInv.accrued_to_clear}`
      );
      
      // Create penalty invoice record in MongoDB
      const penaltyInvoiceId = `PENAL-UTR-${penaltyInv.invoice_id}-${Date.now()}`;
      
      // Calculate the penalty amount for the invoice (this is what goes to NetSuite)
      const adjustedPaymentAmount = this.calculateAdjustedPaymentAmount(
        penaltyInv.payment_amount,
        trackingDoc,
        trackingDoc.current_outstanding,
        trackingDoc.current_outstanding - penaltyInv.payment_amount,
      );
      
      const dailyRateOnPayment = (adjustedPaymentAmount * (trackingDoc.penalty_rate / 100)) / 365;
      const roundedDailyRate = Math.round(dailyRateOnPayment * 100) / 100;
      const penaltyOnPayment = Math.round(roundedDailyRate * daysOverdue * 100) / 100;
      
      this.logger.log(
        `Penalty calculation for NetSuite invoice | ` +
        `Payment: ₹${penaltyInv.payment_amount} (adjusted: ₹${adjustedPaymentAmount}) | ` +
        `Days: ${daysOverdue} | ` +
        `Penalty: ₹${penaltyOnPayment}`
      );
      
      trackingDoc.penalty_invoices.push({
        penalty_invoice_id: penaltyInvoiceId,
        amount: penaltyOnPayment,
        generated_date: today,
        period_from: dueDate,
        period_to: today,
        payment_amount: adjustedPaymentAmount,
        original_payment_amount: penaltyInv.payment_amount,
        days_overdue: daysOverdue,
        calculation_formula: `${adjustedPaymentAmount} × ${trackingDoc.penalty_rate}% / 365 × ${daysOverdue}`,
        status: 'RECONCILED_VIA_UTR',
        transaction_origin: trackingDoc.transaction_origin,
        gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
      });
      
      // Deduct what user actually paid from current accrued
      const accruedToDeduct = penaltyInv.accrued_to_clear;
      trackingDoc.current_accrued_penalty = Math.max(
        0,
        Math.round((currentAccruedBeforeDeduction - accruedToDeduct) * 100) / 100
      );
      
      this.logger.log(
        `Accrued deduction | ` +
        `Before: ₹${currentAccruedBeforeDeduction} | ` +
        `User paid: ₹${accruedToDeduct} | ` +
        `After: ₹${trackingDoc.current_accrued_penalty}`
      );
      
      // Add to payment history
      trackingDoc.payment_history.push({
        payment_date: today,
        payment_type: 'PENALTY_CLEARANCE_UTR',
        amount_paid: adjustedPaymentAmount,
        original_amount_paid: penaltyInv.payment_amount,
        penalty_invoice_generated: penaltyInvoiceId,
        penalty_invoice_amount: penaltyOnPayment,
        calculation: `NetSuite Invoice: ₹${penaltyOnPayment} | User cleared from accrued: ₹${accruedToDeduct}`,
        notes: `Penalty payment via UTR ${penaltyInv.utrno} | NetSuite invoice: ₹${penaltyOnPayment} | Accrued cleared: ₹${accruedToDeduct} | Remaining accrued: ₹${trackingDoc.current_accrued_penalty}`,
        transaction_origin: trackingDoc.transaction_origin,
        gst_retention_applied: trackingDoc.gst_retention && this.isSupplierOriginated(trackingDoc.transaction_origin),
      });
      
      // DO NOT update last_calculation_date or last_payment_date here
      // Those were already updated by the foreground process
      trackingDoc.last_synced_from_netsuite = new Date();
      
      await trackingDoc.save();
      
      this.logger.log(
        ` Penalty cleared in MongoDB | ` +
        `Penalty Invoice Amount: ₹${penaltyOnPayment} | ` +
        `Accrued Cleared: ₹${accruedToDeduct} | ` +
        `Remaining Accrued: ₹${trackingDoc.current_accrued_penalty}`
      );
      
      // CREATE PENALTY INVOICE IN NETSUITE
      try {
        const isBuyerOriginated = !this.isSupplierOriginated(trackingDoc.transaction_origin);
        
        if (isBuyerOriginated) {
          this.logger.log(`Creating penalty invoice in NetSuite (Buyer Originated)`);
          
          const netsuiteResult = await this.netsuiteService.createBackendPenaltyInvoice({
            customer_id: customerId,
            original_invoice_number: trackingDoc.invoice_number,
            penalty_amount: penaltyOnPayment,
            period_from: this.formatDateForNetSuite(dueDate),
            period_to: this.formatDateForNetSuite(today),
            utr_reference: penaltyInv.utrno,
            memo: `Penalty for ${trackingDoc.invoice_number} - Paid via UTR ${penaltyInv.utrno}`,
          });
          
          this.logger.log(`Penalty invoice created in NetSuite: ${JSON.stringify(netsuiteResult)}`);
          
          // Update MongoDB with NetSuite invoice ID
          // Reload the document again to avoid version conflicts
          const freshDoc = await this.invoicePenaltyModel.findOne({
            invoice_id: penaltyInv.invoice_id,
          });
          
          if (freshDoc && netsuiteResult.invoice_id) {
            const lastPenaltyInvoice = freshDoc.penalty_invoices[freshDoc.penalty_invoices.length - 1];
            if (lastPenaltyInvoice) {
              lastPenaltyInvoice.netsuite_invoice_id = netsuiteResult.invoice_id;
              await freshDoc.save();
              this.logger.log(`NetSuite invoice ID updated in MongoDB: ${netsuiteResult.invoice_id}`);
            }
          }
        } else {
          this.logger.log(`Creating penalty bill credit in NetSuite (Supplier Originated)`);
          this.logger.log(` Bill credit creation not yet implemented`);
        }
        
      } catch (netsuiteError) {
        this.logger.error(
          `NetSuite penalty invoice creation failed (MongoDB already updated): ${netsuiteError.message}`
        );
      }
      
    } catch (error) {
      this.logger.error(
        `Error processing penalty for invoice ${penaltyInv.invoice_id}:`,
        error.message
      );
    }
  }
  
  this.logger.log(` Background penalty clearance complete`);
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
 * Calculate payment details for a proposed payment amount
 * Shows what will happen if user pays X amount on Y date
 */
async calculatePaymentDetails(data: {
  invoice_id: string;
  payment_amount: number;
  payment_date: string;
}) {
  this.logger.log(
    `Calculating payment details | ` +
    `Invoice: ${data.invoice_id} | ` +
    `Amount: ₹${data.payment_amount} | ` +
    `Date: ${data.payment_date}`
  );

  const trackingDoc = await this.invoicePenaltyModel.findOne({
    invoice_id: data.invoice_id,
  });

  if (!trackingDoc) {
    throw new Error(`Invoice ${data.invoice_id} not found`);
  }

  // Handle YYYY-MM-DD format from HTML date input
let paymentDate: Date;
if (data.payment_date.includes('-')) {
  // YYYY-MM-DD format
  const [year, month, day] = data.payment_date.split('-').map(Number);
  paymentDate = new Date(year, month - 1, day, 0, 0, 0, 0);
} else if (data.payment_date.includes('/')) {
  // DD/MM/YYYY format
  const [day, month, year] = data.payment_date.split('/').map(Number);
  paymentDate = new Date(year, month - 1, day, 0, 0, 0, 0);
} else {
  throw new Error(`Invalid payment date format: ${data.payment_date}`);
}

this.logger.log(
  `Payment date received: ${data.payment_date} → Parsed: ${paymentDate.toDateString()}`
);

  const dueDate = new Date(trackingDoc.due_date);
  dueDate.setHours(0, 0, 0, 0);

  // Calculate days overdue at payment date
  const daysOverdue = Math.floor(
    (paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate accrued penalty up to payment date
  let accruedUpToPaymentDate = 0;

// Method 1: Use daily penalties if available
const penaltiesBeforePaymentDate = trackingDoc.daily_penalties.filter(dp => {
  const dpDate = new Date(dp.date);
  dpDate.setHours(0, 0, 0, 0);
  return dpDate < paymentDate && !dp.is_invoiced;
});

if (penaltiesBeforePaymentDate.length > 0) {
  // Get accrued till day BEFORE payment
  accruedUpToPaymentDate = penaltiesBeforePaymentDate[penaltiesBeforePaymentDate.length - 1].cumulative_penalty;
  
  this.logger.log(
    `Accrued before payment day: ₹${accruedUpToPaymentDate} | ` +
    `Days in DB: ${penaltiesBeforePaymentDate.length}`
  );
} else {
  // No daily penalties in DB - calculate from scratch
  const currentOutstanding = trackingDoc.current_outstanding;
  const dailyPenalty = (currentOutstanding * (trackingDoc.penalty_rate / 100)) / 365;
  const roundedDaily = Math.round(dailyPenalty * 100) / 100;
  
  // Calculate for days BEFORE payment (not including payment day)
  accruedUpToPaymentDate = Math.round(roundedDaily * (daysOverdue - 1) * 100) / 100;
  
  this.logger.log(
    `No DB penalties - calculated from scratch | ` +
    `Daily: ₹${roundedDaily} × ${daysOverdue - 1} days = ₹${accruedUpToPaymentDate}`
  );
}

// Add penalty for PAYMENT DAY using OLD outstanding (before payment)
const currentOutstanding = trackingDoc.current_outstanding;
const paymentDayPenalty = (currentOutstanding * (trackingDoc.penalty_rate / 100)) / 365;
const roundedPaymentDayPenalty = Math.round(paymentDayPenalty * 100) / 100;

accruedUpToPaymentDate = Math.round((accruedUpToPaymentDate + roundedPaymentDayPenalty) * 100) / 100;

this.logger.log(
  `Payment day (${paymentDate.toDateString()}) penalty added: ` +
  `₹${roundedPaymentDayPenalty} (using OLD outstanding ₹${currentOutstanding}) | ` +
  `Total accrued: ₹${accruedUpToPaymentDate}`
);

  // Adjust payment for GST retention
  const adjustedPaymentAmount = this.calculateAdjustedPaymentAmount(
    data.payment_amount,
    trackingDoc,
    trackingDoc.current_outstanding,
    trackingDoc.current_outstanding - data.payment_amount,
  );

  // Calculate penalty on this specific payment amount
  const dailyRateOnPayment = (adjustedPaymentAmount * (trackingDoc.penalty_rate / 100)) / 365;
  const roundedDailyRate = Math.round(dailyRateOnPayment * 100) / 100;
  const penaltyOnPayment = Math.round(roundedDailyRate * daysOverdue * 100) / 100;

  // Calculate what remains after clearing penalty on payment
  const remainingAccruedAfterPaymentPenalty = Math.max(
    0,
    Math.round((accruedUpToPaymentDate - penaltyOnPayment) * 100) / 100
  );

  this.logger.log(
    `Payment Details Calculated | ` +
    `Accrued: ₹${accruedUpToPaymentDate} | ` +
    `Penalty on Payment: ₹${penaltyOnPayment} | ` +
    `Remaining: ₹${remainingAccruedAfterPaymentPenalty}`
  );

  return {
    invoice_id: data.invoice_id,
    invoice_number: trackingDoc.invoice_number,
    customer_id: trackingDoc.customer_id,
    customer_name: trackingDoc.customer_name,
    current_outstanding: trackingDoc.current_outstanding,
    payment_amount: data.payment_amount,
    adjusted_payment_amount: adjustedPaymentAmount,
    payment_date: paymentDate.toISOString().split('T')[0],
    due_date: trackingDoc.due_date,
    days_overdue: daysOverdue,
    penalty_rate: trackingDoc.penalty_rate,
    
    // Key calculations
    accrued_penalty_up_to_payment_date: accruedUpToPaymentDate,
    penalty_on_payment_amount: penaltyOnPayment,
    remaining_accrued_after_payment_penalty: remainingAccruedAfterPaymentPenalty,
    
    // Payment options
    option1_principal_only: {
      description: 'Pay Principal Only',
      principal_paid: data.payment_amount,
      penalty_cleared: 0,
      total_amount: data.payment_amount,
      remaining_outstanding: trackingDoc.current_outstanding - data.payment_amount,
      remaining_accrued: accruedUpToPaymentDate, // Penalty continues to accrue
    },
    
    option2_principal_plus_payment_penalty: {
      description: 'Pay Principal + Penalty on Payment',
      principal_paid: data.payment_amount,
      penalty_cleared: penaltyOnPayment,
      total_amount: Math.round((data.payment_amount + penaltyOnPayment) * 100) / 100,
      remaining_outstanding: trackingDoc.current_outstanding - data.payment_amount,
      remaining_accrued: remainingAccruedAfterPaymentPenalty,
    },
    
    // option3_principal_plus_all_accrued: {
    //   description: 'Pay Principal + All Accrued Penalty',
    //   principal_paid: data.payment_amount,
    //   penalty_cleared: accruedUpToPaymentDate,
    //   total_amount: Math.round((data.payment_amount + accruedUpToPaymentDate) * 100) / 100,
    //   remaining_outstanding: trackingDoc.current_outstanding - data.payment_amount,
    //   remaining_accrued: 0, // All accrued cleared
    // },
    
    transaction_origin: trackingDoc.transaction_origin,
    gst_retention: trackingDoc.gst_retention,
    gst_adjustment_applied: adjustedPaymentAmount !== data.payment_amount,
  };
}
}
