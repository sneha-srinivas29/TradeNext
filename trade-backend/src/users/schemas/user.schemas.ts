// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// export type UserDocument = User & Document;

// @Schema({ timestamps: true })
// export class User {
//   @Prop({ required: true, unique: true, lowercase: true })
//   email!: string;

//   @Prop({ required: true })
//   password!: string;

//   @Prop({ required: true })
//   firstName!: string;

//   @Prop({ required: true })
//   lastName!: string;

//   @Prop({ default: true })
//   isActive!: boolean;

//   @Prop({ type: String, default: 'user' })
//   role!: string; // FIX: singular string – matches JWT payload & JwtPayload interface

//   @Prop({ default: null })
//   lastLoginAt?: Date;

//   @Prop({ default: null })
//   refreshToken?: string; // stores SHA-256 hash

//   @Prop({ default: null })
//   refreshTokenExpiry?: Date; // FIX: added missing field
// }

// export const UserSchema = SchemaFactory.createForClass(User);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  // ✅ username: auto-derived from email if not provided
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true, default: 'BUYER' })
  role!: string;

  @Prop({ default: null })
  roleName?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: null })
  lastLoginAt?: Date;

  @Prop({ default: null })
  refreshToken?: string;

  @Prop({ default: null })
  refreshTokenExpiry?: Date;

  /**
   * NetSuite internal customer ID (e.g. "3150")
   * Used to fetch contract listings from nonprodapi.samunnati.com
   */
  @Prop({ type: String, default: null })
netsuiteCustomerId?: string;

@Prop({ type: String, default: null })
companyInternalId?: string;

  @Prop({ type: Object, default: {
    canCreateSO: false,
    canEditSO:   false,
    canViewSO:   false,
    canCreatePO: false,
    canEditPO:   false,
    canViewPO:   false,
  }})
  permissions?: {
    canCreateSO: boolean;
    canEditSO:   boolean;
    canViewSO:   boolean;
    canCreatePO: boolean;
    canEditPO:   boolean;
    canViewPO:   boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);