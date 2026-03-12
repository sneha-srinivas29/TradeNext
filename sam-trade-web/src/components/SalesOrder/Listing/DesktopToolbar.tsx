import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/Common/DataTableToolbar";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { statusOptions } from "./Statusfilter";
import { DateRangePicker } from "@/components/SalesOrder/Listing/DateRangePicker";

interface DesktopToolbarProps {
  searchQuery:    string;
  setSearchQuery: (v: string) => void;
  statusFilter:   Set<string>;
  setStatusFilter:(v: Set<string>) => void;
  fromDate:       string;
  setFromDate:    (v: string) => void;
  toDate:         string;
  setToDate:      (v: string) => void;
  onReset:        () => void;
  showReset:      boolean;
}

export const DesktopToolbar = ({
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  fromDate, setFromDate,
  toDate, setToDate,
  onReset, showReset,
}: DesktopToolbarProps) => {
  const navigate = useNavigate();

  return (
    <div className="hidden sm:flex items-center gap-2 flex-wrap mb-4">

      {/* Left: search + status filter */}
      <div className="flex-1 min-w-0">
        <DataTableToolbar
          filterValue={searchQuery}
          onFilterChange={setSearchQuery}
          filterPlaceholder="Filter orders..."
          filters={[
            {
              id: "status",
              title: "Status",
              options: statusOptions,
              selectedValues: statusFilter,
              onSelectionChange: setStatusFilter,
            },
          ]}
          onReset={onReset}
          showReset={showReset}
        />
      </div>

      {/* Right: Date picker + Create */}
      <div className="flex items-center gap-2 shrink-0">
        <DateRangePicker
          fromDate={fromDate} setFromDate={setFromDate}
          toDate={toDate}     setToDate={setToDate}
        />
        <Button
          size="sm"
          className="h-9 shadow-sm"
          onClick={() => navigate("/sales-orders/create")}
        >
          <Plus className="h-4 w-4 mr-1" />
          Create
        </Button>
      </div>
    </div>
  );
};