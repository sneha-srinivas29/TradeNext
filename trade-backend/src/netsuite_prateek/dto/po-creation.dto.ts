// src/netsuite/dto/po-creation.dto.ts
import { IsString, IsBoolean, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class POLineItemDto {
  @IsString()
  itemId: string;

  @IsString()
  quantity: string;

  @IsString()
  rate: string;

  @IsString()
  amount: string;
}

export class POCreationDto {
  @IsString()
  salesOrderId: string;

  @IsString()
  salesOrderNumber: string;

  @IsBoolean()
  poExists: boolean;

  // Optional - only present when poExists = true
  @IsOptional()
  @IsString()
  existingPoId?: string;

  @IsOptional()
  @IsString()
  existingPoNumber?: string;

  // Required when poExists = false
  @IsOptional()
  @IsString()
  customer?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  placeOfSupply?: string;

  @IsOptional()
  @IsString()
  subsidiary?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  salesRep?: string;

  @IsOptional()
  @IsString()
  subsidiaryNexus?: string;

  @IsOptional()
  @IsString()
  subsidiaryTaxReg?: string;

  @IsOptional()
  @IsString()
  stateFssai?: string;

  @IsOptional()
  @IsString()
  supplierPaymentDays?: string;

  @IsOptional()
  @IsBoolean()
  gstRetention?: boolean;

  @IsOptional()
  @IsString()
  supplierAdvance?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  supplierAddress?: string;

  @IsOptional()
  @IsString()
  billState?: string;

  @IsOptional()
  @IsString()
  vendorGst?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POLineItemDto)
  items?: POLineItemDto[];
}