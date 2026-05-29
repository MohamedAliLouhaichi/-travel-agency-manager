import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Min,
  IsEnum,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateHotelBookingDto {
  // General Booking details
  @IsString()
  @IsOptional()
  destination?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPrice?: number;

  @IsEnum(BookingStatus)
  @IsOptional()
  bookingStatus?: BookingStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  // Hotel details
  @IsString()
  @IsOptional()
  hotelName?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsDateString()
  @IsOptional()
  checkInDate?: string;

  @IsDateString()
  @IsOptional()
  checkOutDate?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfNights?: number;

  @IsString()
  @IsOptional()
  roomType?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfRooms?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfGuests?: number;

  @IsString()
  @IsOptional()
  boardType?: string;

  @IsString()
  @IsOptional()
  confirmationNumber?: string;
}
