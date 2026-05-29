import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, currentUserId: string) {
    const { bookingId, amount, paymentMethod, referenceNumber, notes } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch booking with locking or validation
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const bookingTotalPrice = Number(booking.totalPrice);
      const bookingPaidAmount = Number(booking.paidAmount);
      const newPaidAmount = bookingPaidAmount + Number(amount);

      // 2. Validate payment totals
      if (newPaidAmount > bookingTotalPrice) {
        throw new BadRequestException(
          `Payment amount (${amount} TND) exceeds the remaining booking balance (${bookingTotalPrice - bookingPaidAmount} TND). Total booking price: ${bookingTotalPrice} TND.`,
        );
      }

      // 3. Create the payment record
      const payment = await tx.payment.create({
        data: {
          bookingId,
          createdByUserId: currentUserId,
          amount,
          paymentMethod,
          referenceNumber,
          notes,
        },
      });

      // 4. Update the booking totals and status
      const remainingAmount = bookingTotalPrice - newPaidAmount;
      let paymentStatus: PaymentStatus = 'UNPAID';

      if (remainingAmount <= 0) {
        paymentStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount,
          paymentStatus,
        },
      });

      // 5. Create audit log
      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          action: 'CREATE_PAYMENT',
          entityType: 'PAYMENT',
          entityId: payment.id,
          description: `Recorded payment of ${amount} TND via ${paymentMethod} for booking ${bookingId} (Customer: ${booking.customer.firstName} ${booking.customer.lastName})`,
        },
      });

      return payment;
    });
  }

  async findAllForBooking(bookingId: string) {
    const bookingExists = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!bookingExists) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.payment.findMany({
      where: { bookingId },
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }
}
