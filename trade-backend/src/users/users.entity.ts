import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  role: string;

  @Prop()
  parentCompany?: string;

  @Prop({ default: true })
  isActive: boolean;

  // hashed refresh token and expiry
  @Prop()
  refreshTokenHash?: string;

  @Prop()
  refreshTokenExpiry?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
