export interface ItemFulfillment {
  id: string;
  soId: string;
  fulfillmentDate: string;
  fulfillmentAmount: string;
  status: "Order Init" | "In Progress" | "Completed";
  salesInvoiceIds: string[];
  purchaseBillIds: string[];
}

export interface StatusOption {
  label: string;
  value: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  searchQuery: string;
  statusFilter: Set<string>;
  fromDate: string;
  toDate: string;
  sortConfig: SortConfig | null;
}