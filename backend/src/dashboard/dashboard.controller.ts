import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * GET /dashboard/overview
   * ADMIN only – high-level stats for the entire agency.
   */
  @Get('overview')
  @Roles(UserRole.ADMIN)
  getOverview() {
    return this.dashboardService.getOverviewStats();
  }

  /**
   * GET /dashboard/revenue?year=2026
   * ADMIN only – monthly revenue breakdown for the given year.
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
   * GET /dashboard/bookings-by-status
   * Any authenticated user.
   */
  @Get('bookings-by-status')
  getBookingsByStatus() {
    return this.dashboardService.getBookingsByStatus();
  }

  /**
   * GET /dashboard/payment-summary
   * Any authenticated user.
   */
  @Get('payment-summary')
  getPaymentSummary() {
    return this.dashboardService.getPaymentSummary();
  }

  /**
   * GET /dashboard/top-customers?limit=10
   * Any authenticated user.
   */
  @Get('top-customers')
  getTopCustomers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.dashboardService.getTopCustomers(limit);
  }

  /**
   * GET /dashboard/recent-activity?limit=20
   * Any authenticated user.
   */
  @Get('recent-activity')
  getRecentActivity(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe)
    limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }
}
