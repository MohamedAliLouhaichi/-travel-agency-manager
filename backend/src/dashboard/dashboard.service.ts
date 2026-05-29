import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns high-level overview stats:
   * - Total customers
   * - Total bookings (overall + by type)
   * - Total revenue, paid, unpaid
   * - Bookings grouped by status
   * - Last 5 recent bookings
   */
  async getOverviewStats() {
    const [
      totalCustomers,
      totalBookings,
      hotelBookingsCount,
      flightBookingsCount,
      revenueAggregate,
      bookingsByStatus,
      recentBookings,
    ] = await Promise.all([
      // Total customers
      this.prisma.customer.count(),

      // Total bookings
      this.prisma.booking.count(),

      // Hotel bookings count
      this.prisma.booking.count({ where: { bookingType: 'HOTEL' } }),

      // Flight bookings count
      this.prisma.booking.count({ where: { bookingType: 'FLIGHT' } }),

      // Revenue aggregation
      this.prisma.booking.aggregate({
        _sum: {
          totalPrice: true,
          paidAmount: true,
          remainingAmount: true,
        },
      }),

      // Bookings grouped by status
      this.prisma.booking.groupBy({
        by: ['bookingStatus'],
        _count: { id: true },
      }),

      // Recent 5 bookings
      this.prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          employee: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = Number(revenueAggregate._sum.totalPrice ?? 0);
    const totalPaid = Number(revenueAggregate._sum.paidAmount ?? 0);
    const totalUnpaid = Number(revenueAggregate._sum.remainingAmount ?? 0);

    // Transform bookingsByStatus into a keyed object
    const statusBreakdown: Record<string, number> = {};
    for (const entry of bookingsByStatus) {
      statusBreakdown[entry.bookingStatus] = entry._count.id;
    }

    return {
      totalCustomers,
      totalBookings,
      bookingsByType: {
        HOTEL: hotelBookingsCount,
        FLIGHT: flightBookingsCount,
      },
      totalRevenue,
      totalPaid,
      totalUnpaid,
      bookingsByStatus: statusBreakdown,
      recentBookings,
    };
  }

  /**
   * Returns monthly revenue breakdown for a given year.
   * Produces an array of 12 entries (Jan–Dec) with totalRevenue and paidAmount.
   */
  async getRevenueByMonth(year: number) {
    // Fetch all bookings created in the given year with only the fields we need
    const bookings = await this.prisma.booking.findMany({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
      select: {
        totalPrice: true,
        paidAmount: true,
        createdAt: true,
      },
    });

    // Initialize 12 months
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleString('en-US', { month: 'long' }),
      totalRevenue: 0,
      paidAmount: 0,
    }));

    // Aggregate per month
    for (const booking of bookings) {
      const monthIndex = booking.createdAt.getMonth(); // 0-based
      months[monthIndex].totalRevenue += Number(booking.totalPrice);
      months[monthIndex].paidAmount += Number(booking.paidAmount);
    }

    // Round to 3 decimal places to avoid floating-point drift
    for (const m of months) {
      m.totalRevenue = Math.round(m.totalRevenue * 1000) / 1000;
      m.paidAmount = Math.round(m.paidAmount * 1000) / 1000;
    }

    return { year, months };
  }

  /**
   * Returns count of bookings grouped by bookingStatus.
   */
  async getBookingsByStatus() {
    const groups = await this.prisma.booking.groupBy({
      by: ['bookingStatus'],
      _count: { id: true },
    });

    const result: Record<string, number> = {};
    for (const g of groups) {
      result[g.bookingStatus] = g._count.id;
    }

    return result;
  }

  /**
   * Returns payment summary:
   * - Total payments count
   * - Total paid amount
   * - Breakdown by payment method
   */
  async getPaymentSummary() {
    const [totalPayments, totalPaidAggregate, paymentsByMethod] =
      await Promise.all([
        this.prisma.payment.count(),

        this.prisma.payment.aggregate({
          _sum: { amount: true },
        }),

        this.prisma.payment.groupBy({
          by: ['paymentMethod'],
          _count: { id: true },
          _sum: { amount: true },
        }),
      ]);

    const methodBreakdown = paymentsByMethod.map((entry) => ({
      method: entry.paymentMethod,
      count: entry._count.id,
      totalAmount: Number(entry._sum.amount ?? 0),
    }));

    return {
      totalPayments,
      totalPaidAmount: Number(totalPaidAggregate._sum.amount ?? 0),
      paymentsByMethod: methodBreakdown,
    };
  }

  /**
   * Returns top customers ranked by total booking value.
   */
  async getTopCustomers(limit: number) {
    const topCustomers = await this.prisma.booking.groupBy({
      by: ['customerId'],
      _sum: { totalPrice: true, paidAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: limit,
    });

    // Fetch customer details for the top IDs
    const customerIds = topCustomers.map((c) => c.customerId);
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    });

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    return topCustomers.map((entry) => {
      const customer = customerMap.get(entry.customerId);
      return {
        customer: customer ?? { id: entry.customerId },
        totalBookings: entry._count.id,
        totalValue: Number(entry._sum.totalPrice ?? 0),
        totalPaid: Number(entry._sum.paidAmount ?? 0),
      };
    });
  }

  /**
   * Returns recent activity log entries.
   */
  async getRecentActivity(limit: number) {
    return this.prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }
}
