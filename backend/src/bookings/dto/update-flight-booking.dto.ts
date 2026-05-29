import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Min,
  IsEnum,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateFlightBookingDto {
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

  // Flight details
  @IsString()
  @IsOptional()
  airline?: string;

  @IsString()
  @IsOptional()
  flightNumber?: string;

  @IsString()
  @IsOptional()
  departureAirport?: string;

  @IsString()
  @IsOptional()
  arrivalAirport?: string;

  @IsString()
  @IsOptional()
  departureCity?: string;

  @IsString()
  @IsOptional()
  arrivalCity?: string;

  @IsDateString()
  @IsOptional()
  departureDatetime?: string;

  @IsDateString()
  @IsOptional()
  arrivalDatetime?: string;

  @IsString()
  @IsOptional()
  ticketNumber?: string;

  @IsString()
  @IsOptional()
  reservationReference?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  passengerCount?: number;
}
