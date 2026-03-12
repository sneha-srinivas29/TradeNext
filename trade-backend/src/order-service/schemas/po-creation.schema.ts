import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class POCreation {
  @Prop()
  salesOrderId: string;

  @Prop()
  salesOrderNumber: string;

  @Prop()
  poExists: boolean;

  // store the full incoming payload if you want to keep everything
  @Prop({ type: Object })
  payload: any;
}

export type POCreationDocument = POCreation & Document;
export const POCreationSchema = SchemaFactory.createForClass(POCreation);