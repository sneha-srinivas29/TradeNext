export interface PurchaseBill {
  id: string;
  contract: string;
  ifId: string;
  poId: string;
  invoice: string;
  billAmount: string;
  taxAmount: string;
  totalBillAmount: string;
  status: "Order Init" | "Approved" | "Pending" | "Rejected";
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