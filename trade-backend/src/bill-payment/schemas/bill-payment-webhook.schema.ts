import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class AppliedBill {
  @Prop()
  billId: string;

  @Prop()
  invoiceId: string;

  @Prop()
  salesOrderId: string;

  @Prop()
  existingSPD: string;

  @Prop()
  supplierPaymentDays: number;

  @Prop()
  amount: number;
}

@Schema({ _id: false })
export class UpdateResult {
  @Prop()
  invoiceId: string;

  @Prop()
  billId: string;

  @Prop()
  status: string;

  @Prop()
  message: string;

  @Prop()
  alreadyUpdated: boolean;

  @Prop()
  existingSPD: string;

  @Prop()
  expectedSPD: string;

  @Prop()
  validationStatus: string;

  @Prop()
  supplierPaymentDays: number;

  @Prop()
  calculatedDueDate: string;

  @Prop()
  flowType: string;

  @Prop()
  error: string;
}

@Schema({ 
  timestamps: true, 
  collection: 'billpaymentwebhooks',
  versionKey: '__v' 
})
export class BillPaymentWebhook extends Document {
  @Prop({ required: true })
  event: string;

  @Prop({ required: true, index: true })
  billPaymentId: string;

  @Prop()
  tranId: string;

  @Prop()
  total: number;

  @Prop()
  tranDate: string;

  @Prop()
  utrResponseDate: string;

  @Prop()
  status: string;

  @Prop()
  paymentMethod: string;

  @Prop()
  vendor: string;

  @Prop()
  vendorId: string;

  @Prop({ type: [AppliedBill] })
  appliedBills: AppliedBill[];

  @Prop({ type: Object })
  rawData: Record<string, any>;

  @Prop({ 
    type: String,
    enum: ['pending', 'completed', 'partial_failure', 'failed'],
    default: 'pending' 
  })
  processingStatus: string;

  @Prop({ type: [UpdateResult] })
  updateResults: UpdateResult[];

  @Prop({ type: Date, default: Date.now })
  receivedAt: Date;

  @Prop({ type: Date })
  processedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BillPaymentWebhookSchema = SchemaFactory.createForClass(BillPaymentWebhook);

BillPaymentWebhookSchema.index({ billPaymentId: 1, receivedAt: -1 });
BillPaymentWebhookSchema.index({ processingStatus: 1 });
BillPaymentWebhookSchema.index({ createdAt: -1 });
BillPaymentWebhookSchema.index({ event: 1 });