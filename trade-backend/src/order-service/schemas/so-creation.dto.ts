import { IsString, IsBoolean, IsArray, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class SOLineItemDto {
  @IsString()
  item: string;

  @IsString()
  quantity: string;

  @IsOptional()
  @IsString()
  unitid?: string;

  @IsOptional()
  @IsString()
  rate?: string;

  @IsOptional()
  @IsString()
  custcol_item_buy_rate?: string;

  @IsOptional()
  @IsString()
  custcol_in_hsn_code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  broker_perunit_rate?: string;
}

export class SOMetaDetailsDto {
  @IsOptional()
  @IsString()
  initiation_type?: string;

  @IsOptional()
  @IsString()
  created_by_employee?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  created_by_customer?: any;

  @IsOptional()
  deviceType?: any;
}

export class SOCreationDto {
  // All fields are optional so payload passes through untouched
  @IsOptional() entity?: string;
  @IsOptional() customForm?: string;
  @IsOptional() trandate?: string;
  @IsOptional() otherrefnum?: string;
  @IsOptional() subsidiary?: string;
  @IsOptional() custbody_sam_btst_subcustomer?: string;
  @IsOptional() custbody_btst_supplier?: string;
  @IsOptional() custbody_btst_so_supplier_address?: string;
  @IsOptional() custbody_cust_po_attachment?: string[];
  @IsOptional() custbody_so_tran_origin?: string;
  @IsOptional() class?: string;
  @IsOptional() location?: string;
  @IsOptional() memo?: string;
  @IsOptional() entitytaxregnum?: string;
  @IsOptional() billaddress?: string;
  @IsOptional() shipaddress?: string;
  @IsOptional() gst_retention?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SOLineItemDto)
  item?: SOLineItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SOMetaDetailsDto)
  meta_details?: SOMetaDetailsDto;

  @IsOptional() broker_id?: string;
  @IsOptional() creditPeriod?: number;

  // Allow any extra fields from frontend to pass through
  [key: string]: any;
}