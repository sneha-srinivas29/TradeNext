import { useMemo } from "react";
import { PurchaseBill, SortConfig } from "./Purchasebill.types";

interface UseFilteredBillsProps {
  bills: PurchaseBill[];
  searchQuery: string;
  statusFilter: Set<string>;
  sortConfig: SortConfig | null;
}

export const useFilteredBills = ({
  bills,
  searchQuery,
  statusFilter,
  sortConfig,
}: UseFilteredBillsProps) => {
  return useMemo(() => {
    let filtered = [...bills];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (bill) =>
          bill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.contract.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.ifId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.poId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.invoice.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter.size > 0) {
      filtered = filtered.filter((bill) => statusFilter.has(bill.status));
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof PurchaseBill];
        const bValue = b[sortConfig.key as keyof PurchaseBill];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [bills, searchQuery, statusFilter, sortConfig]);
};