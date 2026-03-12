import { Controller, Post, Body, Logger } from '@nestjs/common';
import { BackdatedAdjustmentService } from '../services/backdated-adjustment.service';

@Controller('backdated-adjustment')  // ← removed 'api/' prefix (global prefix already adds /api)
export class BackdatedAdjustmentController {
  private readonly logger = new Logger(BackdatedAdjustmentController.name);

  constructor(
    private readonly backdatedAdjustmentService: BackdatedAdjustmentService,
  ) {}

  @Post('process')
  async processBackdatedPayment(
    @Body() data: {
      invoice_id:           string;
      actual_payment_date:  string;
      payment_amount:       number;
      penal_accrual_clear?: 'Yes' | 'No';
      penal_accrual_amount?: number;
    },
  ) {
    this.logger.log(`Received backdated payment request: ${JSON.stringify(data)}`);
    return this.backdatedAdjustmentService.processBackdatedPayment(data);
  }
}