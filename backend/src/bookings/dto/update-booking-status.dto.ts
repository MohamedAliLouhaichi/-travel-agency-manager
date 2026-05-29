import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus, { message: 'Invalid booking status' })
  @IsNotEmpty({ message: 'Booking status is required' })
  status: BookingStatus;
}
