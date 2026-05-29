import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/overview
   * ADMIN only — high-level financial and business stats for the entire agency.
   *
   * Contains:
   * - total customers
   * - total bookings
   * - total revenue
   * - total paid
   * - total remaining
   */
  @Get('overview')
  @Roles(UserRole.ADMIN)
  getOverview() {
    return this.dashboardService.getOverviewStats();
  }

  /**
   * GET /dashboard/revenue?year=2026
   * ADMIN only — monthly revenue breakdown for the given year.
   *
   * Contains chiffre d'affaires / revenue data.
   */
  @Get('revenue')
  @Roles(UserRole.ADMIN)
  getRevenue(
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ) {
    return this.dashboardService.getRevenueByMonth(year);
  }

  /**
   * GET /dashboard/payment-summary
   * ADMIN only — financial payment summary.
   *
   * Contains:
   * - total paid
   * - total unpaid
   * - total remaining
   * - payment-related financial data
   */
  @Get('payment-summary')
  @Roles(UserRole.ADMIN)
  getPaymentSummary() {
    return this.dashboardService.getPaymentSummary();
  }

  /**
   * GET /dashboard/top-customers?limit=10
   * ADMIN only — top customers based on spending/revenue.
   *
   * This is financial/commercial information, so it must not be visible
   * to the secretary or normal employees.
   */
  @Get('top-customers')
  @Roles(UserRole.ADMIN)
  getTopCustomers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.dashboardService.getTopCustomers(limit);
  }

  /**
   * GET /dashboard/bookings-by-status
   * ADMIN + SECRETARY — operational booking statistics.
   *
   * This does not expose chiffre d'affaires.
   */
  @Get('bookings-by-status')
  getBookingsByStatus() {
    return this.dashboardService.getBookingsByStatus();
  }

  /**
   * GET /dashboard/recent-activity?limit=20
   * ADMIN + SECRETARY — recent operational activity.
   *
   * This should not expose revenue or payment totals.
   */
  @Get('recent-activity')
  getRecentActivity(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe)
    limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }
}