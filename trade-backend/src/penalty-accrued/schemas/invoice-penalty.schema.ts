import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InvoicePenaltyDocument = InvoicePenalty & Document;

@Schema({ _id: false }) // ← Add this back to disable _id
export class PenaltyInvoice {
  @Prop({ required: true })
  penalty_invoice_id: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  generated_date: Date;

  @Prop({ required: true })
  period_from: Date;

  @Prop({ required: true })
  period_to: Date;

  @Prop()
  payment_amount: number;

  @Prop()
  original_payment_amount?: number;

  @Prop()
  days_overdue: number;

  @Prop()
  calculation_formula: string;

  @Prop({ default: 'OUTSTANDING' })
  status: string;

  @Prop()
  paid_date?: Date;

  @Prop()
  netsuite_invoice_id?: string;

  @Prop()
  transaction_origin?: string;

  @Prop({ default: false })
  gst_retention_applied?: boolean;
}

@Schema({ _id: false }) // ← Add this back
export class DailyPenalty {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  principal_amount: number;

  @Prop({ required: true })
  daily_penalty: number;

  @Prop({ required: true })
  cumulative_penalty: number;

  @Prop({ default: false })
  is_invoiced: boolean;

  @Prop()
  penalty_invoice_ref?: string;

  @Prop()
  penalty_invoice_amount?: number;

  @Prop()
  accrued_after_deduction?: number;
}

@Schema({ _id: false }) // ← Add this back
export class PaymentHistory {
  @Prop({ required: true })
  payment_date: Date;

  @Prop({ required: true })
  payment_type: string;

  @Prop({ required: true })
  amount_paid: number;

  @Prop()
  original_amount_paid?: number;

  @Prop()
  new_outstanding?: number;

  @Prop()
  penalty_invoice_generated?: string;

  @Prop()
  penalty_invoice_amount?: number;
  
  @Prop()
  payment_reference?: string;

  @Prop()
  penalty_invoice_paid?: string;

  @Prop()
  calculation?: string;

  @Prop()
  notes?: string;

  @Prop()
  transaction_origin?: string;

  @Prop({ default: false })
  gst_retention_applied?: boolean;
}

@Schema({ timestamps: true, collection: 'invoice_penalties' })
export class InvoicePenalty {
  @Prop({ required: true, unique: true, index: true })
  invoice_id: string;

  @Prop()
  invoice_number: string;

  @Prop({ required: true, index: true })
  customer_id: string;

  @Prop()
  customer_name: string;

  @Prop({ required: true })
  original_amount: number;

  @Prop({ required: true })
  current_outstanding: number;

  @Prop()
  spd: Date;

  @Prop({ required: true })
  due_date: Date;

  @Prop({ required: true })
  penalty_rate: number;

  @Prop({ default: 'OVERDUE', index: true })
  status: string;

  @Prop({ default: 0 })
  current_accrued_penalty: number;

  @Prop()
  last_calculation_date: Date;

  @Prop({ type: [PenaltyInvoice], default: [] })
  penalty_invoices: PenaltyInvoice[];

  @Prop({ type: [DailyPenalty], default: [] })
  daily_penalties: DailyPenalty[];

  @Prop({ type: [PaymentHistory], default: [] })
  payment_history: PaymentHistory[];

  @Prop()
  last_synced_from_netsuite: Date;

  @Prop()
  last_payment_date?: Date;

  @Prop()
  transaction_origin?: string;

  @Prop({ default: false })
  gst_retention?: boolean;

  @Prop({ default: 0 })
  invoice_tax_amount?: number;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const InvoicePenaltySchema = SchemaFactory.createForClass(InvoicePenalty);