import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsOptional()
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @IsEnum(UserRole, { message: 'Role must be either ADMIN or SECRETARY' })
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus, { message: 'Status must be either ACTIVE or INACTIVE' })
  @IsOptional()
  status?: UserStatus;
}
