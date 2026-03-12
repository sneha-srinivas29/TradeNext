import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/dashboard/summary
   * Returns complete dashboard summary (ALL data)
   */
  @Get('summary')
  async getDashboardSummary() {
    return this.dashboardService.getDashboardSummary();
  }
}