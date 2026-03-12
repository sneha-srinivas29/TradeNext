

import DashboardLayout from "@/components/Common/DashboardLayout";
import TablePagination from "@/components/ui/TablePagination";
import TradeVolumeChart from "@/components/Dashboard/TradeVolumeChart";
import { useState } from "react";

// ─── Static dashboard stats (no longer derived from mock salesOrders) ─────────

const stats = [
  {
    label: "Total Trades",
    shortValue: "—",
    fullValue: "—",
    link: "View Details",
  },
  {
    label: "Ongoing Trades",
    shortValue: "—",
    fullValue: "—",
    link: "View Details",
  },
  {
    label: "Unadjusted Receipt",
    shortValue: "₹2 Cr",
    fullValue: "₹2,00,00,000",
    link: "View Details",
  },
  {
    label: "Overdue Invoices",
    shortValue: "01",
    fullValue: "01",
    link: "View Details",
  },
  {
    label: "Penal Accrued",
    shortValue: "₹20K",
    fullValue: "₹20,000.00",
    link: "View Details",
  },
];

const pendingTasks = [
  {
    docId: "SO15834291",
    type: "Sale Order",
    description: "Confirm sale order acknowledgement",
  },
  {
    docId: "SI40127854",
    type: "Sale Invoice",
    description: "Upload Goods Receipt Notes (GRNs)",
  },
  {
    docId: "PB77219403",
    type: "Purchase Bill",
    description: "Upload supplier invoice for item fulfilment",
  },
  {
    docId: "SO15834987",
    type: "Sale Order",
    description: "Approve revised delivery schedule",
  },
  {
    docId: "SI40128612",
    type: "Sale Invoice",
    description: "Reconcile invoice mismatch with SO",
  },
];

const overdueInvoices = [
  {
    id: "SI4012",
    dueDate: "12-1-2023",
    value: "₹3,20,000",
    paid: "₹1,50,000",
    remaining: "₹1,70,000",
    penalty: "₹18,500",
    total: "₹1,88,500",
  },
  {
    id: "SI4018",
    dueDate: "18-10-2023",
    value: "₹1,95,000",
    paid: "₹95,000",
    remaining: "₹1,00,000",
    penalty: "₹12,000",
    total: "₹1,12,000",
  },
  {
    id: "SI4025",
    dueDate: "25-2-2023",
    value: "₹4,10,000",
    paid: "₹2,10,000",
    remaining: "₹2,00,000",
    penalty: "₹22,000",
    total: "₹2,22,000",
  },
  {
    id: "SI4031",
    dueDate: "01-3-2023",
    value: "₹2,75,000",
    paid: "₹1,75,000",
    remaining: "₹1,00,000",
    penalty: "₹9,500",
    total: "₹1,09,500",
  },
  {
    id: "SI4040",
    dueDate: "05-08-2023",
    value: "₹5,60,000",
    paid: "₹3,00,000",
    remaining: "₹2,60,000",
    penalty: "₹30,000",
    total: "₹2,90,000",
  },
];

const contracts = [
  { id: "#C13584", value: "₹3 Crores", utilized: "₹2 Cr", unutilized: "₹1 Cr", progress: 66 },
  { id: "#C13585", value: "₹4 Crores", utilized: "₹2 Cr", unutilized: "₹2 Cr", progress: 50 },
];

const Dashboard = () => {
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [pendingTasksPage, setPendingTasksPage] = useState(1);
  const [overdueInvoicesPage, setOverdueInvoicesPage] = useState(1);

  const totalPendingTasksPages = 5;
  const totalOverdueInvoicesPages = 5;

  return (
    <DashboardLayout>
      {/* General Statistics */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-foreground">General Statistics</h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="group bg-card p-4 rounded-lg shadow-sm border border-border transition-all hover:shadow-md hover:border-primary/20">
              <p className="text-sm text-black mb-1">{stat.label}</p>

              <div className="relative h-10 overflow-hidden">
                <p className="absolute inset-0 text-xl font-bold text-foreground
                  transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">
                  {stat.shortValue}
                </p>
                <p className="absolute inset-0 text-sm font-semibold
                  text-foreground opacity-0 transition-all duration-300
                  group-hover:opacity-100 group-hover:translate-y-0 flex items-center">
                  {stat.fullValue}
                </p>
              </div>

              <button className="mt-3 text-sm text-chart-1 underline text-primary font-medium">
                {stat.link}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Trade Volume Area Chart */}
      <section className="mb-8">
        <TradeVolumeChart />
      </section>

      {/* Total Purchase Approved Limit */}
      <h3 className="font-semibold mb-3 text-foreground">Approved Limits</h3>
      <section className="mb-8 bg-card rounded-lg border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-chart-1 text-sm font-medium">Total Purchase Limits</span>
          <span className="bg-primary text-success px-3 py-1 rounded-md text-sm font-medium">
            Approved ₹10 Crores
          </span>
        </div>

        <div className="flex items-center justify-between text-sm mb-2 text-muted-foreground">
          <span>Utilised ₹7 Cr</span>
          <span>Un-Utilised ₹3 Cr</span>
        </div>

        <div className="w-full h-6 bg-yellow-500 rounded-md overflow-hidden mb-3 flex">
          <div className="h-full bg-primary" style={{ width: "70%" }}></div>
        </div>

        <div className="flex justify-center mt-3">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-chart-1 text-sm hover:underline font-medium"
          >
            {showBreakdown ? "Hide Breakdown" : "Show Breakdown"}
          </button>
        </div>

        {showBreakdown && (
          <div className="mt-6">
            <h4 className="font-medium mb-4 text-foreground">Limit Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contracts.map((contract, idx) => (
                <div key={idx} className="bg-muted/50 rounded-lg p-4 shadow-sm border-l-4 border border-yellow-500">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-foreground">Contract - {contract.id}</span>
                    <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-sm">
                      Value: {contract.value}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-2 text-muted-foreground">
                    <span>Utilised {contract.utilized}</span>
                    <span>Un-Utilised {contract.unutilized}</span>
                  </div>

                  <div className="w-full h-4 bg-yellow-500 rounded-md overflow-hidden mb-1 flex">
                    <div className="h-full bg-primary" style={{ width: `${contract.progress}%` }}></div>
                    <div className="h-full bg-yellow-500" style={{ width: `${100 - contract.progress}%` }}></div>
                  </div>

                  <button className="text-chart-1 text-sm mt-2 hover:underline font-medium">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Pending Tasks */}
      <section className="mb-8">
        <h3 className="font-semibold mb-4 text-foreground">Pending Tasks - Need your attention</h3>

        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="bg-primary text-primary-foreground whitespace-nowrap">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium w-[160px]">Document ID</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium w-[180px]">Document Type</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">Pending Task Description</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium w-[140px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.map((task, idx) => (
                  <tr key={idx} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-chart-1 underline cursor-pointer font-medium">
                      {task.docId}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-chart-1 underline cursor-pointer font-medium">
                      {task.type}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-foreground">{task.description}</td>
                    <td className="px-2 sm:px-4 py-3 text-right">
                      <button className="w-full sm:w-auto bg-primary text-primary-foreground text-xs py-2 px-3 rounded-md hover:bg-primary/90 transition-colors font-medium">
                        Take Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={pendingTasksPage}
            totalPages={totalPendingTasksPages}
            onPrevious={() => setPendingTasksPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPendingTasksPage((prev) => Math.min(totalPendingTasksPages, prev + 1))}
          />
        </div>
      </section>

      {/* Overdue Invoices */}
      <section>
        <h3 className="font-semibold mb-4 text-foreground">Overdue Invoices</h3>
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary text-primary-foreground whitespace-nowrap">
                <tr>
                  <th className="px-3 py-3 text-left font-medium">Invoice ID</th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium">Invoice Value</th>
                  <th className="px-4 py-3 text-left font-medium">Amount Paid</th>
                  <th className="px-4 py-3 text-left font-medium">Amount Remaining</th>
                  <th className="px-4 py-3 text-left font-medium">Penalty Accrued</th>
                  <th className="px-4 py-3 text-left font-medium">Total Remaining</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.map((invoice, idx) => (
                  <tr key={idx} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-chart-1 underline cursor-pointer font-medium">{invoice.id}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-foreground">{invoice.dueDate}</td>
                    <td className="px-4 py-3 text-foreground">{invoice.value}</td>
                    <td className="px-4 py-3 text-foreground">{invoice.paid}</td>
                    <td className="px-4 py-3 text-foreground">{invoice.remaining}</td>
                    <td className="px-4 py-3 text-destructive font-medium">{invoice.penalty}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{invoice.total}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="bg-primary text-white text-xs py-1.5 min-w-[100px] rounded-md hover:bg-gray-300 transition-colors font-medium">
                          View Invoice
                        </button>
                        <button className="bg-primary text-white text-xs py-1.5 min-w-[100px] rounded-md hover:bg-success/90 transition-colors font-medium">
                          Pay Now
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={overdueInvoicesPage}
            totalPages={totalOverdueInvoicesPages}
            onPrevious={() => setOverdueInvoicesPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setOverdueInvoicesPage((prev) => Math.min(totalOverdueInvoicesPages, prev + 1))}
          />
        </div>
      </section>
    </DashboardLayout>
  );
};

export default Dashboard;