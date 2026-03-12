import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, MessageCircle } from "lucide-react";
import { PurchaseBill, SortConfig } from "./Purchasebill.types";

interface PurchaseBillsTableProps {
  bills: PurchaseBill[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
}

const PurchaseBillsTable = ({
  bills,
  sortConfig,
  onSort,
}: PurchaseBillsTableProps) => {
  const navigate = useNavigate();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-primary/10 text-primary border-primary/20 font-medium";
      case "Rejected":
        return "bg-destructive/10 text-destructive border-destructive/20 font-medium";
      case "Order Init":
        return "bg-amber-50 text-amber-600 border-amber-200 font-medium";
      case "Pending":
        return "bg-blue-50 text-blue-600 border-blue-200 font-medium";
      default:
        return "";
    }
  };

  return (
    <Card className="rounded-xl border-border/60 shadow-sm p-0">
      <Table>
        <TableHeader className="sticky top-0 left-0">
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead
              className="cursor-pointer font-semibold text-foreground whitespace-nowrap bg-primary text-white"
              onClick={() => onSort('id')}
            >
              <div className="flex items-center gap-1">
                PB ID
                <ArrowUpDown className="h-3.5 w-3.5 text-white" />
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              Contract
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              IF ID
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              PO ID
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              Invoice
            </TableHead>
            <TableHead
              className="cursor-pointer font-semibold text-foreground whitespace-nowrap bg-primary text-white"
              onClick={() => onSort('billAmount')}
            >
              <div className="flex items-center gap-1">
                Bill Amount
                <ArrowUpDown className="h-3.5 w-3.5 text-white" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer font-semibold text-foreground whitespace-nowrap bg-primary text-white"
              onClick={() => onSort('taxAmount')}
            >
              <div className="flex items-center gap-1">
                Tax Amount
                <ArrowUpDown className="h-3.5 w-3.5 text-white" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer font-semibold text-foreground whitespace-nowrap bg-primary text-white"
              onClick={() => onSort('totalBillAmount')}
            >
              <div className="flex items-center gap-1">
                Total Bill Amount
                <ArrowUpDown className="h-3.5 w-3.5 text-white" />
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              Status
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white text-center">
              Chat
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            bills.map((bill) => (
              <TableRow key={bill.id} className="hover:bg-gray-100 transition-colors">
                <TableCell
                  className="font-medium text-primary underline underline-offset-2 cursor-pointer whitespace-nowrap"
                  onClick={() => navigate(`/purchase-bills/view/${bill.id}`)}
                >
                  {bill.id}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {bill.contract}
                </TableCell>
                <TableCell
                  className="text-primary underline underline-offset-2 cursor-pointer whitespace-nowrap"
                  onClick={() => navigate(`/item-fulfillments/view/${bill.ifId}`)}
                >
                  {bill.ifId}
                </TableCell>
                <TableCell
                  className="text-primary underline underline-offset-2 cursor-pointer whitespace-nowrap"
                  onClick={() => navigate(`/purchase-orders/view/${bill.poId}`)}
                >
                  {bill.poId}
                </TableCell>
                <TableCell
                  className="text-primary underline underline-offset-2 cursor-pointer whitespace-nowrap"
                  onClick={() => navigate(`/invoices/view/${bill.invoice}`)}
                >
                  {bill.invoice}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {bill.billAmount}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {bill.taxAmount}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {bill.totalBillAmount}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge
                    variant="secondary"
                    className={getStatusBadgeClass(bill.status)}
                  >
                    {bill.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(`/purchase-bills/chat/${bill.id}`)}
                  >
                    <MessageCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default PurchaseBillsTable;