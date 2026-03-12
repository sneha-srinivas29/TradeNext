import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// ============================================
// PENALTY LINE ITEM (for both invoice & bill credit)
// ============================================
@Schema({ _id: false })
export class PenaltyLineItem {
    @Prop({ required: true })
    lineNumber: number;

    @Prop({ required: true })
    item: string;

    @Prop()
    itemDisplay: string;

    @Prop({ required: true })
    itemAmount: number;

    @Prop()
    itemHsnCode: string;

    @Prop()
    taxRate: number;

    @Prop()
    igstRate: number;

    @Prop()
    cgstRate: number;

    @Prop()
    sgstRate: number;

    @Prop({ required: true })
    penaltyAmount: number;

    @Prop()
    adjustedAmount: number;

    @Prop()
    appliedRatio: number;
}

// ============================================
// PNC RECORD (Penalty Creation Document)
// ============================================
@Schema({ _id: false })
export class PNCRecord {
    @Prop()
    pncId: string; // NetSuite PNC internal ID

    @Prop({ default: false })
    existsInNetSuite: boolean;

    @Prop()
    createdByScript: string; // 'netsuite_script' | 'middleware'

    @Prop()
    createdAt: Date;

    @Prop()
    invoiceId: string;

    @Prop()
    installmentNumber: number;

    @Prop()
    paymentDocumentNo: string;

    @Prop()
    installmentDueDate: Date;

    @Prop()
    paymentDate: Date;

    @Prop()
    tradeNumber: string;

    @Prop()
    paidAmount: number;

    @Prop()
    paymentAmountExclTax: number;

    @Prop()
    collectableDate: Date;

    //   @Prop()
    //   dueDateCriteria: string;

    @Prop()
    calcDays: number;
}

// ============================================
// PENALTY INVOICE DETAILS
// ============================================
@Schema({ _id: false })
export class PenaltyInvoiceDetails {
    @Prop()
    penaltyInvoiceId: string; // NetSuite penalty invoice ID

    @Prop({ default: false })
    created: boolean;

    @Prop()
    penaltyInvoiceNumber: string;

    @Prop()
    totalAmount: number;

    @Prop()
    taxAmount: number;

    @Prop({ type: [PenaltyLineItem] })
    lineItems: PenaltyLineItem[];

    @Prop()
    createdAt: Date;

    @Prop()
    createdBy: string; // 'netsuite_script' | 'middleware'

    @Prop()
    status: string; // 'pending' | 'created' | 'failed'

    @Prop({ default: '' })
    errorMessage: string;
}

// ============================================
// PENALTY BILL CREDIT DETAILS
// ============================================
@Schema({ _id: false })
export class PenaltyBillCreditDetails {
    @Prop()
    billCreditId: string; // NetSuite bill credit ID

    @Prop({ default: false })
    created: boolean;

    @Prop()
    billCreditNumber: string;

    @Prop()
    totalAmount: number;

    @Prop()
    taxAmount: number;

    @Prop({ type: [PenaltyLineItem] })
    lineItems: PenaltyLineItem[];

    @Prop()
    createdAt: Date;

    @Prop()
    createdBy: string; // 'netsuite_script' | 'middleware'

    @Prop()
    status: string; // 'pending' | 'created' | 'failed'

    @Prop({ default: '' })
    errorMessage: string;

    @Prop()
    derivedAnnualMargin: number;

    @Prop()
    contractedMargin: number;

    @Prop()
    creditPeriodDays: number;
}

// ============================================
// MAIN PENALTY DOCUMENT
// ============================================
@Schema({
    timestamps: true,
    collection: 'penalties',
    versionKey: '__v'
})
export class Penalty extends Document {
    // ===== IDENTIFICATION =====
    @Prop({ required: true, index: true })
    customerPaymentId: string; // Bill Payment ID from webhook

    @Prop({ required: true, index: true })
    invoiceId: string;

    @Prop({ required: true })
    installmentNumber: number;

    @Prop({
        type: String,
        enum: ['buyer', 'supplier'],
        required: true,
        index: true
    })
    originationType: string; // Buyer originated (1) or Supplier originated (2)

    // ===== TRANSACTION DETAILS =====
    @Prop({ required: true })
    customer: string;

    @Prop()
    vendor: string;

    @Prop()
    salesOrderId: string;

    @Prop()
    billId: string;

    @Prop()
    tradeNumber: string;

    @Prop()
    location: string;

    @Prop()
    subsidiary: string;

    @Prop()
    class: string;

    // ===== DATES =====
    @Prop({ required: true })
    milestoneDueDate: Date;

    @Prop({ required: true })
    paymentDate: Date;

    @Prop()
    graceDate: Date;

    @Prop()
    collectableDate: Date;

    @Prop()
    minLockinDate: Date;

    // ===== AMOUNTS =====
    @Prop({ required: true })
    paidAmount: number;

    @Prop({ required: true })
    appliedAmount: number;

    @Prop({ required: true })
    invoiceAmount: number;

    @Prop()
    milestoneDueAmount: number;

    @Prop()
    penalInterest: number;

    @Prop({ required: true })
    calcDays: number; // Days overdue

    // ===== TAX & GST =====
    @Prop({ default: false })
    gstRetention: boolean;

    @Prop()
    taxTotal: number;

    @Prop()
    invoiceGrossAmount: number;

    // ===== ADDITIONAL FIELDS =====
    @Prop()
    supplierPaymentDays: number;

    @Prop()
    contractedMargin: number;

    // ===== PNC DETAILS =====
    @Prop({ type: PNCRecord })
    pnc: PNCRecord;

    // ===== PENALTY INVOICE (for Buyer Originated) =====
    @Prop({ type: PenaltyInvoiceDetails })
    penaltyInvoice: PenaltyInvoiceDetails;

    // ===== PENALTY BILL CREDIT (for Supplier Originated) =====
    @Prop({ type: PenaltyBillCreditDetails })
    penaltyBillCredit: PenaltyBillCreditDetails;

    // ===== PROCESSING STATUS =====
    @Prop({
        type: String,
        enum: [
            'received',           // Just received from webhook
            'pnc_checking',       // Checking if PNC exists
            'pnc_creating',       // Creating PNC
            'pnc_created',        // PNC created/exists
            // Buyer
            'penalty_invoice_checking',
            'penalty_invoice_creating',
            'penalty_invoice_created',

            // Supplier
            'bill_credit_checking',
            'bill_credit_creating',
            'bill_credit_created',

            'completed',          // All done
            'failed',             // Failed
            'partial'             // Some steps succeeded
        ],
        default: 'received',
        index: true
    })
    processingStatus: string;

    @Prop()
    processingError: string;

    // ===== VALIDATION FLAGS =====
    @Prop({ default: false })
    isDueDateCrossed: boolean;

    @Prop({ default: false })
    isEligibleForPenalty: boolean;

    @Prop()
    eligibilityReason: string;

    // ===== METADATA =====
    @Prop({ type: Object })
    rawWebhookData: Record<string, any>;

    @Prop()
    processedAt: Date;

    @Prop({ default: 0 })
    retryCount: number;

    @Prop()
    lastRetryAt: Date;

    createdAt?: Date;
    updatedAt?: Date;
}

export const PenaltySchema = SchemaFactory.createForClass(Penalty);

// ===== INDEXES =====
PenaltySchema.index({ customerPaymentId: 1, invoiceId: 1, installmentNumber: 1 }, { unique: true });
PenaltySchema.index({ processingStatus: 1 });
PenaltySchema.index({ originationType: 1 });
PenaltySchema.index({ createdAt: -1 });
PenaltySchema.index({ salesOrderId: 1 });
PenaltySchema.index({ 'pnc.pncId': 1 });
PenaltySchema.index({ 'penaltyInvoice.penaltyInvoiceId': 1 });
PenaltySchema.index({ 'penaltyBillCredit.billCreditId': 1 });