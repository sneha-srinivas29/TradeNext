import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BillPaymentWebhook } from '../../bill-payment/schemas/bill-payment-webhook.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(BillPaymentWebhook.name)
    private readonly webhookModel: Model<BillPaymentWebhook>,
  ) { }

  /**
   * GET /api/dashboard/summary
   * Returns complete dashboard with ALL MongoDB data
   */
  async getDashboardSummary() {
    // Fetch ALL completed webhooks
    const webhooks = await this.webhookModel
      .find({ processingStatus: 'completed' })
      .lean()
      .exec();

    console.log('Total webhooks found:', webhooks.length);

    // 1. BASIC SUMMARY
    const totalPayments = webhooks.length;
    const totalAmount = webhooks.reduce((sum, w: any) => sum + (w.total || 0), 0);
    const totalInvoices = webhooks.reduce((sum, w: any) =>
      sum + (w.appliedBills?.length || 0), 0
    );

    // 2. VENDOR BREAKDOWN
    const vendorStats: any = {};
    webhooks.forEach((w: any) => {
      const vendor = w.vendor || 'Unknown';
      if (!vendorStats[vendor]) {
        vendorStats[vendor] = { vendor, count: 0, totalAmount: 0 };
      }
      vendorStats[vendor].count += 1;
      vendorStats[vendor].totalAmount += w.total || 0;
    });

    const vendorSummary = Object.values(vendorStats)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount);

    // Find highest paid vendor
    //const highestVendor = vendorSummary[0] || { vendor: 'N/A', totalAmount: 0 };

    // 3. PAYMENT METHOD BREAKDOWN
    const paymentMethods: any = {};
    webhooks.forEach((w: any) => {
      const method = w.paymentMethod || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // 4. UTR vs DUE DATE ANALYSIS

    const utrVsDueDate: any[] = [];
    webhooks.forEach((w: any) => {
      if (!w.utrResponseDate || !w.appliedBills) return;

      w.appliedBills.forEach((bill: any) => {
        if (bill.supplierPaymentDays) {
          try {
            // Parse the date string (format: "5/1/2026" or "12/1/2026")
            const [month, day, year] = w.utrResponseDate.split('/');
            const utrDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

            // Calculate due date
            const dueDate = new Date(utrDate);
            dueDate.setDate(dueDate.getDate() + parseInt(bill.supplierPaymentDays));

            utrVsDueDate.push({
              billPaymentId: w.billPaymentId,
              vendor: w.vendor,
              invoiceId: bill.invoiceId,
              utrDate: w.utrResponseDate,
              dueDate: `${dueDate.getMonth() + 1}/${dueDate.getDate()}/${dueDate.getFullYear()}`,
              supplierPaymentDays: bill.supplierPaymentDays,
              amount: w.total
            });
          } catch (err) {
            console.error('Error parsing date for bill:', bill.invoiceId, err);
          }
        }
      });
    });

    // 5. STATUS DISTRIBUTION
    const statusDist = {
      completed: webhooks.filter((w: any) => w.processingStatus === 'completed').length,
      pending: webhooks.filter((w: any) => w.processingStatus === 'pending').length,
      failed: webhooks.filter((w: any) => w.processingStatus === 'partial_failure').length
    };

    // 6. TOP 10 INVOICES BY AMOUNT
    const topInvoices = [...webhooks]
      .sort((a: any, b: any) => (b.total || 0) - (a.total || 0))
      .slice(0, 10)
      .map((w: any) => ({
        billPaymentId: w.billPaymentId,
        vendor: w.vendor,
        amount: w.total,
        date: w.tranDate,
        invoiceCount: w.appliedBills?.length || 0
      }));

    // 7. PAYMENT TIMELINE (Group by date)
    const timeline: any = {};
    webhooks.forEach((w: any) => {
      if (!w.receivedAt) return;
      const date = new Date(w.receivedAt).toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = { date, count: 0, totalAmount: 0 };
      }
      timeline[date].count += 1;
      timeline[date].totalAmount += w.total || 0;
    });

    const timelineArray = Object.values(timeline)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    const highestVendor = vendorSummary.length > 0
      ? { name: (vendorSummary[0] as any).vendor, amount: (vendorSummary[0] as any).totalAmount }
      : { name: 'N/A', amount: 0 };

    return {
      summary: {
        totalPayments,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalInvoices,
        averagePayment: totalPayments > 0
          ? Math.round((totalAmount / totalPayments) * 100) / 100
          : 0,
        totalVendors: Object.keys(vendorStats).length,
        highestVendor  
      },
      vendorSummary,
      paymentMethods,
      utrVsDueDate: utrVsDueDate.slice(0, 20), // Top 20
      statusDistribution: statusDist,
      topInvoices,
      timeline: timelineArray
    };
  }
}