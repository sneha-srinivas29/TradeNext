import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  
  @Get()
  getRoot() {
    return {
      message: 'NetSuite Bill Payment Webhook API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        webhook: '/api/webhook/bill-payment',
        getBillPayment: '/api/webhook/bill-payment/:id',
        getAllWebhooks: '/api/webhook/bill-payment',
        dashboard: '/api/dashboard/summary',
        dashboardUI: '/dashboard.html',
        penaltyCalculator: '/penalty-calculator.html', // ← Added
         penaltyReconciliationTest: '/penalty-reconciliation-test.html',
        penalties: {
          sync: '/api/penalties/sync',
          getInvoice: '/api/penalties/invoices/:invoiceId',
          getCustomer: '/api/penalties/customers/:customerId/invoices',
          calculateProrated: '/api/penalties/calculate-prorated',
          calculateBulk: '/api/penalties/calculate-prorated-bulk',
           reconcileWithUtr: '/api/penalties/reconcile-with-utr', // ← NEW
          reconcilePayment: '/api/penalties/reconcile-payment',
          backdateAdjustment: '/api/penalties/backdate-adjustment',
        }
      }
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
  }
}





