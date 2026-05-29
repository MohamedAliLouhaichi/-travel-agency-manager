import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

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
