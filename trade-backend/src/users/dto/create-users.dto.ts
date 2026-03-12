import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsOptional()
  username?: string; // auto-derived from email if not provided

  @IsString()
  @IsOptional()
  role?: string; // defaults to 'BUYER'

  @IsString()
  @IsOptional()
  roleName?: string; // defaults to 'BUYER'

  @IsString()
  @IsOptional()
  netsuiteCustomerId?: string; // NetSuite internal ID e.g. "3150"
}