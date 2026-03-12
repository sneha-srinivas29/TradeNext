import { Controller, Post, Get, Body, Param, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PenaltiesService } from '../services/penalties.service';

@Controller('penalties')
export class PenaltiesController {
  private readonly logger = new Logger(PenaltiesController.name);

  constructor(private readonly penaltiesService: PenaltiesService) {}

  /**
   * Sync endpoint called by NetSuite cron job
   * POST /api/penalties/sync
   */
  @Post('sync')
  async sync(@Body() payload: any): Promise<any> {
    try {
      this.logger.log('Received sync request from NetSuite');
      this.logger.debug(`Invoices count: ${payload.invoices?.length || 0}`);

      const result = await this.penaltiesService.syncFromNetSuite(payload);

      return result;
    } catch (error) {
      this.logger.error('Error in sync endpoint:', error.message);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get invoice details
   * GET /api/penalties/invoices/:invoiceId
   */
  @Get('invoices/:invoiceId')
  async getInvoiceDetails(@Param('invoiceId') invoiceId: string) {
    try {
      const details = await this.penaltiesService.getInvoiceDetails(invoiceId);
      return {
        success: true,
        data: details,
      };
    } catch (error) {
      this.logger.error(`Error getting invoice details for ${invoiceId}:`, error.message);
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Get all overdue invoices for a customer
   * GET /api/penalties/customers/:customerId/invoices
   */
  @Get('customers/:customerId/invoices')
  async getCustomerInvoices(@Param('customerId') customerId: string) {
    try {
      const invoices = await this.penaltiesService.getCustomerInvoices(customerId);
      
      // Calculate summary
      const summary = {
        total_principal_outstanding: 0,
        total_penalty_calculated: 0,
        total_accrued_penalty: 0,
        total_penalty: 0,
      };

      invoices.forEach(inv => {
        summary.total_principal_outstanding += inv.current_outstanding;
        summary.total_penalty_calculated += inv.penalty_amounts_calculated;
        summary.total_accrued_penalty += inv.current_accrued_penalty;
        summary.total_penalty += inv.total_penalty;
      });

      // Round summary values
      Object.keys(summary).forEach(key => {
        summary[key] = Math.round(summary[key] * 100) / 100;
      });

      return {
        success: true,
        data: {
          customer_id: customerId,
          summary,
          invoices,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting customer invoices for ${customerId}:`, error.message);
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calculate prorated penalty for invoice advance
   * POST /api/penalties/calculate-prorated
   */
  @Post('calculate-prorated')
  async calculateProratedPenalty(
    @Body() body: {
      invoice_id: string;
      proposed_payment_amount: number;
      payment_date?: string;
    }
  ) {
    try {
      this.logger.log(`Calculating prorated penalty for invoice: ${body.invoice_id}`);
      this.logger.log(`Proposed payment: ₹${body.proposed_payment_amount}`);
      
      const paymentDate = body.payment_date ? new Date(body.payment_date) : undefined;
      
      const result = await this.penaltiesService.calculateProratedPenalty(
        body.invoice_id,
        body.proposed_payment_amount,
        paymentDate,
      );
      
      this.logger.log(`Prorated calculation complete`);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Error calculating prorated penalty:', error.message);
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
 * Reconcile payment with optional accrued penalty clearance
 * POST /api/penalties/reconcile-payment
 */
@Post('reconcile-payment')
async reconcilePayment(
  @Body() body: {
    reconciliations: Array<{
      invoice_number: string;
      outstanding_amount_for_recon: number;
      penal_accrual_clear: 'Yes' | 'No';
      penal_accrual_recon_amount?: number;
      payment_date?: string; // Optional: date of actual payment
    }>;
  }
) {
  try {
    this.logger.log(`Reconciling ${body.reconciliations.length} payments`);
    
    const results = await Promise.all(
      body.reconciliations.map(recon =>
        this.penaltiesService.reconcilePaymentWithAccrued(recon)
      )
    );
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      total_reconciled: results.length,
      results,
    };
  } catch (error) {
    this.logger.error('Error in payment reconciliation:', error.message);
    throw new HttpException(
      {
        success: false,
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}



/**
 * Reconcile payment with UTR - handles both principal and penalty
 * POST /api/penalties/reconcile-with-utr
 */
@Post('reconcile-with-utr')
async reconcileWithUtr(@Body() body: {
  custid: string;
  paymentdate: string;
  utrno: string;
  memo: string;
  amount: number;
  invoices: Array<{
    invoiceId: string;
    amount: number;
    prorated_penalty_clear?: 'Yes' | 'No';
  }>;
}) {
  try {
    this.logger.log(`Reconciling payment with UTR: ${body.utrno}`);
    
    const result = await this.penaltiesService.reconcilePaymentWithUtr(body);
    
    return result;
  } catch (error) {
    this.logger.error('Error in UTR reconciliation:', error.message);
    throw new HttpException(
      {
        success: false,
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Calculate payment details before reconciliation
 * POST /api/penalties/calculate-payment-details
 */
@Post('calculate-payment-details')
async calculatePaymentDetails(
  @Body() body: {
    invoice_id: string;
    payment_amount: number;
    payment_date: string;
  }
) {
  try {
    this.logger.log(
      `Calculating payment details | ` +
      `Invoice: ${body.invoice_id} | ` +
      `Amount: ₹${body.payment_amount}`
    );
    
    const result = await this.penaltiesService.calculatePaymentDetails(body);
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    this.logger.error('Error calculating payment details:', error.message);
    throw new HttpException(
      {
        success: false,
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
}
