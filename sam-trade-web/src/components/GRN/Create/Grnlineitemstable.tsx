import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineItem } from "./Grn.types";

interface GRNLineItemsTableProps {
  lineItems: LineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
}

const GRNLineItemsTable: React.FC<GRNLineItemsTableProps> = ({
  lineItems,
  setLineItems,
}) => {
  const handleItemChange = (id: number, field: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="mb-8 rounded-lg overflow-hidden border border-gray-200">
      <Table>
        {/* Header */}
        <TableHeader>
          <TableRow className="bg-primary">
            <TableHead className="text-white font-semibold text-sm h-12">
              GRN Item
            </TableHead>
            <TableHead className="text-white font-semibold text-sm text-center h-12">
              Received Quantity
            </TableHead>
          </TableRow>
        </TableHeader>

        {/* Body */}
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.id} className="hover:bg-gray-50">
              
              {/* Item ID */}
              <TableCell className="py-4">
                <Input
                  value={item.custrecord_sam_grn_item}
                  onChange={(e) =>
                    handleItemChange(
                      item.id,
                      "custrecord_sam_grn_item",
                      e.target.value
                    )
                  }
                  placeholder="Enter Item ID"
                  className="border-gray-300"
                />
              </TableCell>

              {/* Received Quantity */}
              <TableCell className="text-center">
                <Input
                  type="number"
                  value={item.custrecord_sam_grn_received_quantity}
                  onChange={(e) =>
                    handleItemChange(
                      item.id,
                      "custrecord_sam_grn_received_quantity",
                      e.target.value
                    )
                  }
                  placeholder="Enter Qty"
                  className="w-32 text-center border-gray-300 mx-auto"
                  min="0"
                />
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GRNLineItemsTable;