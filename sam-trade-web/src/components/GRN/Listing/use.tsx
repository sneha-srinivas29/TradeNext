import { useState, useMemo } from "react";
import { GrnItem } from "./GrnTable";

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export const useGrnFilters = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, Set<string>>>({
    status: new Set(),
    billStatus: new Set(),
    paymentStatus: new Set(),
  });
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [fromDate, setFromDate] = useState("01-01-2023");
  const [toDate, setToDate] = useState("31-12-2023");

  const handleFilterChange = (key: string, value: Set<string>) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      status: new Set(),
      billStatus: new Set(),
      paymentStatus: new Set(),
    });
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleReset = () => {
    setSearchQuery("");
    handleClearAllFilters();
  };

  const handleDateReset = () => {
    setFromDate("01-01-2023");
    setToDate("31-12-2023");
  };

  const totalActiveFilters = Object.values(filters).reduce(
    (sum, filterSet) => sum + filterSet.size,
    0
  );

  return {
    searchQuery,
    setSearchQuery,
    filters,
    handleFilterChange,
    handleClearAllFilters,
    sortConfig,
    handleSort,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    handleReset,
    handleDateReset,
    totalActiveFilters,
  };
};

export const useFilteredGrns = (
  data: GrnItem[],
  searchQuery: string,
  filters: Record<string, Set<string>>,
  sortConfig: SortConfig | null,
  poNo?: string
) => {
  return useMemo(() => {
    let grns =
      poNo && poNo !== ":poNo"
        ? data.filter((item) => item.poNo === poNo)
        : [...data];

    // Search filter
    if (searchQuery) {
      grns = grns.filter(
        (item) =>
          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.poNo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply all filters dynamically
    Object.entries(filters).forEach(([key, filterSet]) => {
      if (filterSet.size > 0) {
        grns = grns.filter((item) =>
          filterSet.has(item[key as keyof GrnItem])
        );
      }
    });

    // Sorting
    if (sortConfig) {
      grns.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof GrnItem];
        const bValue = b[sortConfig.key as keyof GrnItem];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return grns;
  }, [data, searchQuery, filters, sortConfig, poNo]);
};