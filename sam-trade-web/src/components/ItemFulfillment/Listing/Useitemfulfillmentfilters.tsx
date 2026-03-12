import { useMemo } from "react";
import { ItemFulfillment, SortConfig } from "./itemfulfillment.type";

interface UseFilteredFulfillmentsProps {
  fulfillments: ItemFulfillment[];
  searchQuery: string;
  statusFilter: Set<string>;
  sortConfig: SortConfig | null;
  soId?: string;
}

export const useFilteredFulfillments = ({
  fulfillments,
  searchQuery,
  statusFilter,
  sortConfig,
  soId,
}: UseFilteredFulfillmentsProps) => {
  return useMemo(() => {
    let filtered = soId && soId !== ':soId'
      ? fulfillments.filter((item) => item.soId === soId)
      : [...fulfillments];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.soId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.salesInvoiceIds.some(invoice => 
            invoice.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          item.purchaseBillIds.some(bill => 
            bill.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply status filter
    if (statusFilter.size > 0) {
      filtered = filtered.filter((item) => statusFilter.has(item.status));
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof ItemFulfillment];
        const bValue = b[sortConfig.key as keyof ItemFulfillment];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [fulfillments, searchQuery, statusFilter, sortConfig, soId]);
};