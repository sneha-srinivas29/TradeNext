import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableRowActions } from "@/components/Common/DataTableRowActions";
import { ArrowUpDown } from "lucide-react";

export interface GrnItem {
  id: string;
  date: string;
  supplier: string;
  poNo: string;
  receivedQty: string;
  amount: string;
  billStatus: string;
  paymentStatus: string;
  ageing: string;
  status: string;
}

interface GrnTableProps {
  data: GrnItem[];
  onSort: (key: string) => void;
  onCopyId: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getBillStatusColor = (status: string) => {
  return status === "Generated"
    ? "bg-primary/10 text-primary border-primary/20 font-medium"
    : "bg-amber-50 text-amber-600 border-amber-200 font-medium";
};

const getPaymentStatusColor = (status: string) => {
  if (status === "Paid") {
    return "bg-green-50 text-green-600 border-green-200 font-medium";
  }
  if (status === "Partial") {
    return "bg-blue-50 text-blue-600 border-blue-200 font-medium";
  }
  return "bg-red-50 text-red-600 border-red-200 font-medium";
};

const getGrnStatusColor = (status: string) => {
  if (status === "Completed") {
    return "bg-primary/10 text-primary border-primary/20 font-medium";
  }
  if (status === "Partial") {
    return "bg-blue-50 text-blue-600 border-blue-200 font-medium";
  }
  return "bg-amber-50 text-amber-600 border-amber-200 font-medium";
};

export const GrnTable = ({ data, onSort, onCopyId, onDelete }: GrnTableProps) => {
  const navigate = useNavigate();

  return (
    <Card className="rounded-xl border-border/60 shadow-sm p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 left-0">
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead
                className="cursor-pointer font-semibold text-foreground whitespace-nowrap bg-primary text-white"
                onClick={() => onSort('id')}
              >
                <div className="flex items-center gap-1">
                  GRN No
                  <ArrowUpDown className="h-3.5 w-3.5 text-white" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer font-semibold text-foreground whitespace-nowrap bg-primary text-white"
                onClick={() => onSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="h-3.5 w-3.5 text-white" />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
                Supplier
              </TableHead>
              <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
                PO No
              </TableHead>
              <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
                Received Qty
              </TableHead>
              <TableHead
                className="cursor-pointer font-semibold text-foreground whitespace-nowrap bg-primary text-white"
                onClick={() => onSort('amount')}
              >
                <div className="flex items-center gap-1">
                  Amount
                  <ArrowUpDown className="h-3.5 w-3.5 text-white" />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
                Bill Status
              </TableHead>
              <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
                Payment Status
              </TableHead>
              <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
                Ageing
              </TableHead>
              <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
                Status
              </TableHead>
              <TableHead className="font-semibold text-foreground whitespace-nowrap w-[60px] bg-primary text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-100 transition-colors">
                  <TableCell
                    className="font-medium text-primary underline underline-offset-2 cursor-pointer whitespace-nowrap"
                    onClick={() => navigate(`/grn/view/${item.id}`)}
                  >
                    {item.id}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{item.date}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.supplier}</TableCell>
                  <TableCell
                    className="whitespace-nowrap text-primary underline underline-offset-2 cursor-pointer"
                    onClick={() => navigate(`/purchase-orders/view/${item.poNo}`)}
                  >
                    {item.poNo}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {item.receivedQty}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {item.amount}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className={getBillStatusColor(item.billStatus)}>
                      {item.billStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className={getPaymentStatusColor(item.paymentStatus)}>
                      {item.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {item.ageing}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className={getGrnStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <DataTableRowActions
                      onView={() => navigate(`/grn-view/${item.id}`)}
                      onEdit={() => navigate(`/grn/edit/${item.id}`)}
                      onCopy={() => onCopyId(item.id)}
                      onDelete={onDelete ? () => onDelete(item.id) : undefined}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};