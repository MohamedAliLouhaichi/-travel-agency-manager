import { IsEmail, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  passportNumber?: string;

  @IsDateString({}, { message: 'Passport expiry must be a valid ISO date' })
  @IsOptional()
  passportExpiry?: string;

  @IsDateString({}, { message: 'Date of birth must be a valid ISO date' })
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
