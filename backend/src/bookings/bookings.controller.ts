import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { BookingsService } from './bookings.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateHotelBookingDto } from './dto/create-hotel-booking.dto';
import { CreateFlightBookingDto } from './dto/create-flight-booking.dto';
import { UpdateHotelBookingDto } from './dto/update-hotel-booking.dto';
import { UpdateFlightBookingDto } from './dto/update-flight-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private paymentsService: PaymentsService,
  ) {}

  @Post('hotel')
  createHotelBooking(
    @Body() dto: CreateHotelBookingDto,
    @GetUser() currentUser: any,
  ) {
    return this.bookingsService.createHotelBooking(dto, currentUser.id);
  }

  @Post('flight')
  createFlightBooking(
    @Body() dto: CreateFlightBookingDto,
    @GetUser() currentUser: any,
  ) {
    return this.bookingsService.createFlightBooking(dto, currentUser.id);
  }

  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('bookingType') bookingType?: 'HOTEL' | 'FLIGHT',
    @Query('bookingStatus') bookingStatus?: BookingStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('search') search?: string,
  ) {
    return this.bookingsService.findAll({
      customerId,
      bookingType,
      bookingStatus,
      paymentStatus,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/hotel')
  updateHotelBooking(
    @Param('id') id: string,
    @Body() dto: UpdateHotelBookingDto,
    @GetUser() currentUser: any,
  ) {
    return this.bookingsService.updateHotelBooking(id, dto, currentUser.id);
  }

  @Patch(':id/flight')
  updateFlightBooking(
    @Param('id') id: string,
    @Body() dto: UpdateFlightBookingDto,
    @GetUser() currentUser: any,
  ) {
    return this.bookingsService.updateFlightBooking(id, dto, currentUser.id);
  }

  @Patch(':id/status')
  updateBookingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @GetUser() currentUser: any,
  ) {
    return this.bookingsService.updateBookingStatus(id, dto.status, currentUser.id);
  }

  @Get(':bookingId/payments')
  findPaymentsForBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findAllForBooking(bookingId);
  }
}
