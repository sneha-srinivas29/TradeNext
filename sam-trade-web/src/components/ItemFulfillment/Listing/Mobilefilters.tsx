import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SearchBar from "./Searchbar"
import StatusFilter from "./Statusfilter";
import DateRangePicker from "../../Common/Daterangefilter";
import { StatusOption } from "../../ItemFulfillment/Listing/itemfulfillment.type";


interface MobileFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: Set<string>;
  onStatusChange: (statusFilter: Set<string>) => void;
  statusOptions: StatusOption[];
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onDateReset: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const MobileFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onDateReset,
  onReset,
  hasActiveFilters,
}: MobileFiltersProps) => {
  const navigate = useNavigate();

  return (
    <div className="sm:hidden space-y-3 mb-6">
      {/* Row 1: Search Input */}
      <div className="w-full">
        <SearchBar 
          value={searchQuery} 
          onChange={onSearchChange} 
        />
      </div>

      {/* Row 2: Status, Date, Create */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <StatusFilter
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          statusOptions={statusOptions}
          showLabel={false}
        />

        {/* Date Range Picker */}
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={onFromDateChange}
          onToDateChange={onToDateChange}
          onReset={onDateReset}
        />

        {/* Create Button */}
        <Button
          size="sm"
          className="h-9 shadow-sm whitespace-nowrap"
          onClick={() => navigate("/item-fulfillments/create")}
        >
          <Plus className="h-4 w-3 mr-1" />
          Create
        </Button>
      </div>

      {/* Reset button if filters active */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full h-9"
        >
          Reset Filters
        </Button>
      )}
    </div>
  );
};

export default MobileFilters;