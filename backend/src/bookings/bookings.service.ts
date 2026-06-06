import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelBookingDto } from './dto/create-hotel-booking.dto';
import { CreateFlightBookingDto } from './dto/create-flight-booking.dto';
import { UpdateHotelBookingDto } from './dto/update-hotel-booking.dto';
import { UpdateFlightBookingDto } from './dto/update-flight-booking.dto';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async createHotelBooking(dto: CreateHotelBookingDto, employeeId: string) {
    // 1. Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 2. Create booking + hotel booking details in a single operation
    const booking = await this.prisma.booking.create({
      data: {
        customerId: dto.customerId,
        employeeId,
        bookingType: 'HOTEL',
        destination: dto.destination,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        totalPrice: dto.totalPrice,
        paidAmount: 0,
        remainingAmount: dto.totalPrice,
        bookingStatus: dto.bookingStatus || 'DRAFT',
        paymentStatus: 'UNPAID',
        notes: dto.notes,
        hotelBooking: {
          create: {
            hotelName: dto.hotelName,
            city: dto.city,
            country: dto.country,
            checkInDate: new Date(dto.checkInDate),
            checkOutDate: new Date(dto.checkOutDate),
            numberOfNights: dto.numberOfNights,
            roomType: dto.roomType,
            numberOfRooms: dto.numberOfRooms,
            numberOfGuests: dto.numberOfGuests,
            boardType: dto.boardType,
            confirmationNumber: dto.confirmationNumber,
          },
        },
      },
      include: {
        hotelBooking: true,
        customer: true,
      },
    });

    // 3. Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: employeeId,
        action: 'CREATE_BOOKING',
        entityType: 'BOOKING',
        entityId: booking.id,
        description: `Created Hotel Booking for ${customer.firstName} ${customer.lastName} at ${dto.hotelName}`,
      },
    });

    return booking;
  }

  async createFlightBooking(dto: CreateFlightBookingDto, employeeId: string) {
    // 1. Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 2. Create booking + flight booking details in a single operation
    const booking = await this.prisma.booking.create({
      data: {
        customerId: dto.customerId,
        employeeId,
        bookingType: 'FLIGHT',
        destination: dto.destination,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        totalPrice: dto.totalPrice,
        paidAmount: 0,
        remainingAmount: dto.totalPrice,
        bookingStatus: dto.bookingStatus || 'DRAFT',
        paymentStatus: 'UNPAID',
        notes: dto.notes,
        flightBooking: {
          create: {
            airline: dto.airline,
            flightNumber: dto.flightNumber,
            departureAirport: dto.departureAirport,
            arrivalAirport: dto.arrivalAirport,
            departureCity: dto.departureCity,
            arrivalCity: dto.arrivalCity,
            departureDatetime: new Date(dto.departureDatetime),
            arrivalDatetime: new Date(dto.arrivalDatetime),
            ticketNumber: dto.ticketNumber,
            reservationReference: dto.reservationReference,
            passengerCount: dto.passengerCount,
          },
        },
      },
      include: {
        flightBooking: true,
        customer: true,
      },
    });

    // 3. Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: employeeId,
        action: 'CREATE_BOOKING',
        entityType: 'BOOKING',
        entityId: booking.id,
        description: `Created Flight Booking for ${customer.firstName} ${customer.lastName} (${dto.airline} - ${dto.flightNumber})`,
      },
    });

    return booking;
  }

  async findAll(filters: {
    customerId?: string;
    bookingType?: 'HOTEL' | 'FLIGHT';
    bookingStatus?: BookingStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
  }) {
    const where: any = {};

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.bookingType) {
      where.bookingType = filters.bookingType;
    }
    if (filters.bookingStatus) {
      where.bookingStatus = filters.bookingStatus;
    }
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.search) {
      where.OR = [
        { destination: { contains: filters.search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        hotelBooking: true,
        flightBooking: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        hotelBooking: true,
        flightBooking: true,
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
          include: {
            createdByUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        invoices: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateHotelBooking(id: string, dto: UpdateHotelBookingDto, currentUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { hotelBooking: true },
    });

    if (!booking || booking.bookingType !== 'HOTEL') {
      throw new NotFoundException('Hotel booking not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Recalculate prices if totalPrice is changed
      let totalPrice = booking.totalPrice;
      let paidAmount = booking.paidAmount;
      let remainingAmount = booking.remainingAmount;
      let paymentStatus = booking.paymentStatus;

      if (dto.totalPrice !== undefined) {
        if (Number(dto.totalPrice) < Number(paidAmount)) {
          throw new BadRequestException('Total price cannot be lower than the already paid amount');
        }
        totalPrice = new Prisma.Decimal(dto.totalPrice);
        remainingAmount = totalPrice.minus(paidAmount);
        paymentStatus = remainingAmount.equals(0)
          ? 'PAID'
          : paidAmount.greaterThan(0)
            ? 'PARTIALLY_PAID'
            : 'UNPAID';
      }

      // 2. Perform updates
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          destination: dto.destination,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          totalPrice,
          remainingAmount,
          paymentStatus,
          bookingStatus: dto.bookingStatus,
          notes: dto.notes,
          hotelBooking: {
            update: {
              hotelName: dto.hotelName,
              city: dto.city,
              country: dto.country,
              checkInDate: dto.checkInDate ? new Date(dto.checkInDate) : undefined,
              checkOutDate: dto.checkOutDate ? new Date(dto.checkOutDate) : undefined,
              numberOfNights: dto.numberOfNights,
              roomType: dto.roomType,
              numberOfRooms: dto.numberOfRooms,
              numberOfGuests: dto.numberOfGuests,
              boardType: dto.boardType,
              confirmationNumber: dto.confirmationNumber,
            },
          },
        },
        include: {
          hotelBooking: true,
          customer: true,
        },
      });

      // 3. Log activity
      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          action: 'UPDATE_BOOKING',
          entityType: 'BOOKING',
          entityId: id,
          description: `Updated Hotel Booking for customer ${updatedBooking.customer.firstName} ${updatedBooking.customer.lastName}`,
        },
      });

      return updatedBooking;
    });
  }

  async updateFlightBooking(id: string, dto: UpdateFlightBookingDto, currentUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { flightBooking: true },
    });

    if (!booking || booking.bookingType !== 'FLIGHT') {
      throw new NotFoundException('Flight booking not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Recalculate prices if totalPrice is changed
      let totalPrice = booking.totalPrice;
      let paidAmount = booking.paidAmount;
      let remainingAmount = booking.remainingAmount;
      let paymentStatus = booking.paymentStatus;

      if (dto.totalPrice !== undefined) {
        if (Number(dto.totalPrice) < Number(paidAmount)) {
          throw new BadRequestException('Total price cannot be lower than the already paid amount');
        }
        totalPrice = new Prisma.Decimal(dto.totalPrice);
        remainingAmount = totalPrice.minus(paidAmount);
        paymentStatus = remainingAmount.equals(0)
          ? 'PAID'
          : paidAmount.greaterThan(0)
            ? 'PARTIALLY_PAID'
            : 'UNPAID';
      }

      // 2. Perform updates
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          destination: dto.destination,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          totalPrice,
          remainingAmount,
          paymentStatus,
          bookingStatus: dto.bookingStatus,
          notes: dto.notes,
          flightBooking: {
            update: {
              airline: dto.airline,
              flightNumber: dto.flightNumber,
              departureAirport: dto.departureAirport,
              arrivalAirport: dto.arrivalAirport,
              departureCity: dto.departureCity,
              arrivalCity: dto.arrivalCity,
              departureDatetime: dto.departureDatetime ? new Date(dto.departureDatetime) : undefined,
              arrivalDatetime: dto.arrivalDatetime ? new Date(dto.arrivalDatetime) : undefined,
              ticketNumber: dto.ticketNumber,
              reservationReference: dto.reservationReference,
              passengerCount: dto.passengerCount,
            },
          },
        },
        include: {
          flightBooking: true,
          customer: true,
        },
      });

      // 3. Log activity
      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          action: 'UPDATE_BOOKING',
          entityType: 'BOOKING',
          entityId: id,
          description: `Updated Flight Booking for customer ${updatedBooking.customer.firstName} ${updatedBooking.customer.lastName}`,
        },
      });

      return updatedBooking;
    });
  }

  async updateBookingStatus(id: string, status: BookingStatus, currentUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { bookingStatus: status },
      include: {
        customer: true,
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: currentUserId,
        action: 'UPDATE_BOOKING_STATUS',
        entityType: 'BOOKING',
        entityId: id,
        description: `Updated Booking status to ${status} for customer ${booking.customer.firstName} ${booking.customer.lastName}`,
      },
    });

    return updatedBooking;
  }

  async deleteMany(ids: string[], currentUserId: string) {
    const uniqueIds = [...new Set(ids)];

    const bookings = await this.prisma.booking.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        bookingType: true,
        destination: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (bookings.length !== uniqueIds.length) {
      throw new NotFoundException('One or more selected bookings were not found');
    }

    const bookingsWithInvoices = bookings.filter(
      (booking) => booking._count.invoices > 0,
    );

    if (bookingsWithInvoices.length > 0) {
      const labels = bookingsWithInvoices
        .map(
          (booking) =>
            `${booking.bookingType} booking for ${booking.customer.firstName} ${booking.customer.lastName} to ${booking.destination}`,
        )
        .join(', ');

      throw new BadRequestException(
        `Cannot delete bookings with generated invoices: ${labels}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.deleteMany({
        where: { id: { in: uniqueIds } },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          action: 'DELETE_BOOKINGS',
          entityType: 'BOOKING',
          description: `Deleted ${result.count} booking record(s)`,
        },
      });

      return {
        deletedCount: result.count,
        requestedCount: uniqueIds.length,
      };
    });
  }
}
