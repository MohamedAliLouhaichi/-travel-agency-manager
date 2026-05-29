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

export class CreateFlightBookingDto {
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

  // Flight details
  @IsString()
  @IsNotEmpty({ message: 'Airline is required' })
  airline: string;

  @IsString()
  @IsNotEmpty({ message: 'Flight number is required' })
  flightNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Departure airport is required' })
  departureAirport: string;

  @IsString()
  @IsNotEmpty({ message: 'Arrival airport is required' })
  arrivalAirport: string;

  @IsString()
  @IsNotEmpty({ message: 'Departure city is required' })
  departureCity: string;

  @IsString()
  @IsNotEmpty({ message: 'Arrival city is required' })
  arrivalCity: string;

  @IsDateString({}, { message: 'Departure datetime must be a valid ISO date' })
  @IsNotEmpty({ message: 'Departure datetime is required' })
  departureDatetime: string;

  @IsDateString({}, { message: 'Arrival datetime must be a valid ISO date' })
  @IsNotEmpty({ message: 'Arrival datetime is required' })
  arrivalDatetime: string;

  @IsString()
  @IsOptional()
  ticketNumber?: string;

  @IsString()
  @IsOptional()
  reservationReference?: string;

  @IsNumber()
  @Min(1, { message: 'Passenger count must be at least 1' })
  passengerCount: number;
}
