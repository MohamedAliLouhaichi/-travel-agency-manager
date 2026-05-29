import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Min,
  IsEnum,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class CreateHotelBookingDto {
  // General Booking details
  @IsString()
  @IsNotEmpty({ message: 'Customer ID is required' })
  customerId: string;

  @IsString()
  @IsNotEmpty({ message: 'Destination is required' })
  destination: string;

  @IsDateString({}, { message: 'Start date must be a valid ISO date' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @IsDateString({}, { message: 'End date must be a valid ISO date' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;

  @IsNumber({}, { message: 'Total price must be a number' })
  @Min(0, { message: 'Total price cannot be negative' })
  totalPrice: number;

  @IsEnum(BookingStatus, { message: 'Invalid booking status' })
  @IsOptional()
  bookingStatus?: BookingStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  // Hotel details
  @IsString()
  @IsNotEmpty({ message: 'Hotel name is required' })
  hotelName: string;

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  country: string;

  @IsDateString({}, { message: 'Check-in date must be a valid ISO date' })
  @IsNotEmpty({ message: 'Check-in date is required' })
  checkInDate: string;

  @IsDateString({}, { message: 'Check-out date must be a valid ISO date' })
  @IsNotEmpty({ message: 'Check-out date is required' })
  checkOutDate: string;

  @IsNumber()
  @Min(1, { message: 'Number of nights must be at least 1' })
  numberOfNights: number;

  @IsString()
  @IsNotEmpty({ message: 'Room type is required' })
  roomType: string;

  @IsNumber()
  @Min(1, { message: 'Number of rooms must be at least 1' })
  numberOfRooms: number;

  @IsNumber()
  @Min(1, { message: 'Number of guests must be at least 1' })
  numberOfGuests: number;

  @IsString()
  @IsNotEmpty({ message: 'Board type is required' })
  boardType: string;

  @IsString()
  @IsOptional()
  confirmationNumber?: string;
}
