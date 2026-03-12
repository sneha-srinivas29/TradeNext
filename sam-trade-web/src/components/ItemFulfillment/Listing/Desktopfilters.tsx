import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SearchBar from "./Searchbar"
import StatusFilter from "./Statusfilter"
import DateRangePicker from "../../Common/Daterangefilter";
import { StatusOption } from "./itemfulfillment.type";

interface DesktopFiltersProps {
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
}

const DesktopFilters = ({
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
}: DesktopFiltersProps) => {
  const navigate = useNavigate();

  return (
    <div className="hidden sm:flex items-center justify-between mb-6 gap-3">
      {/* LEFT — Search */}
      <div className="flex-1 max-w-sm">
        <SearchBar 
          value={searchQuery} 
          onChange={onSearchChange} 
        />
      </div>

      {/* RIGHT — Filters and Actions */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <StatusFilter
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          statusOptions={statusOptions}
          showLabel={true}
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
          className="h-9 shadow-sm"
          onClick={() => navigate("/item-fulfillments/create")}
        >
          <Plus className="h-4 w-3 mr-2" />
          Create
        </Button>
      </div>
    </div>
  );
};

export default DesktopFilters;