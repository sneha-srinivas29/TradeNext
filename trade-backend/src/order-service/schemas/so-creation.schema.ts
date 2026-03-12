import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as crypto from 'crypto';

@Schema({ timestamps: true })
export class SOCreation {
  @Prop({ required: true, unique: true })
  middlewareId: string; // Our tracking ID: "MW-<uuid>"

  // NetSuite SO details - populated after NetSuite responds
  @Prop()
  netsuiteSOId?: string;

  @Prop()
  netsuiteSONumber?: string;

  // Status tracking
  @Prop({ default: 'pending' })
  status: string; // pending | so_created | po_exists | po_created | po_failed

  // Full original payload from frontend (passed to NetSuite unchanged)
  @Prop({ type: Object, required: true })
  originalPayload: any;

  // NetSuite SO creation response
  @Prop({ type: Object })
  netsuiteResponse?: any;

  // PO details - populated when workflow triggers PO creation
  @Prop()
  poId?: string;

  @Prop()
  poNumber?: string;

  @Prop()
  poExists?: boolean;

  // Full PO payload received from NetSuite workflow
  @Prop({ type: Object })
  poPayload?: any;

  @Prop()
  errorMessage?: string;
}

export type SOCreationDocument = SOCreation & Document;
export const SOCreationSchema = SchemaFactory.createForClass(SOCreation);