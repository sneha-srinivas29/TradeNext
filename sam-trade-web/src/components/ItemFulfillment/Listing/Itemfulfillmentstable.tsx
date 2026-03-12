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
import { ItemFulfillment, SortConfig } from "../Listing/itemfulfillment.type";

interface FulfillmentsTableProps {
  fulfillments: ItemFulfillment[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onCopyId: (id: string) => void;
}

const FulfillmentsTable = ({
  fulfillments,
  sortConfig,
  onSort,
  onCopyId,
}: FulfillmentsTableProps) => {
  const navigate = useNavigate();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-primary/10 text-primary border-primary/20 font-medium";
      case "In Progress":
        return "bg-blue-50 text-blue-600 border-blue-200 font-medium";
      case "Order Init":
        return "bg-amber-50 text-amber-600 border-amber-200 font-medium";
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
                IF ID
                <ArrowUpDown className="h-3.5 w-3.5 text-white" />
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              SO ID
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              Fulfillment Date
            </TableHead>
            <TableHead
              className="cursor-pointer font-semibold text-foreground whitespace-nowrap bg-primary text-white"
              onClick={() => onSort('fulfillmentAmount')}
            >
              <div className="flex items-center gap-1">
                Fulfillment Amnt
                <ArrowUpDown className="h-3.5 w-3.5 text-white" />
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              Status
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              Sales Invoices
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap bg-primary text-white">
              Purchase Bills
            </TableHead>
            <TableHead className="font-semibold text-foreground whitespace-nowrap w-[60px] bg-primary text-white">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fulfillments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            fulfillments.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-100 transition-colors">
                <TableCell
                  className="font-medium text-primary underline underline-offset-2 cursor-pointer whitespace-nowrap"
                  onClick={() => navigate(`/item-fulfillments/view/${item.id}`)}
                >
                  {item.id}
                </TableCell>
                <TableCell
                  className="whitespace-nowrap text-primary underline underline-offset-2 cursor-pointer"
                  onClick={() => navigate(`/sales-orders/view/${item.soId}`)}
                >
                  {item.soId}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {item.fulfillmentDate}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {item.fulfillmentAmount}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge
                    variant="secondary"
                    className={getStatusBadgeClass(item.status)}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-primary underline underline-offset-2 cursor-pointer">
                  {item.salesInvoiceIds.join(", ")}
                </TableCell>
                <TableCell className="whitespace-nowrap text-primary underline underline-offset-2 cursor-pointer">
                  {item.purchaseBillIds.join(", ")}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <DataTableRowActions
                    onView={() => navigate(`/item-fulfillments/view/${item.id}`)}
                    onItemFulfillment={() => navigate(`/item-fulfillments/listing/${item.soId}`)}
                    onEdit={() => { }}
                    onCopy={() => onCopyId(item.id)}
                    onDelete={() => { }}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default FulfillmentsTable;