import { DataTableToolbar } from "@/components/Common/DataTableToolbar";
import { StatusOption } from "../Listing/Purchasebill.types"
import DateRangePicker from "../../Common/Daterangefilter";
import ActionButtons from "./Actionbuttons";

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
  onReset: () => void;
  showReset: boolean;
  onDownload: () => void;
  onUpload: () => void;
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
  onReset,
  showReset,
  onDownload,
  onUpload,
}: DesktopFiltersProps) => {
  return (
    <div className="hidden sm:flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      {/* LEFT — Filters */}
      <DataTableToolbar
        filterValue={searchQuery}
        onFilterChange={onSearchChange}
        filterPlaceholder="Search..."
        filters={[
          {
            id: "status",
            title: "Status",
            options: statusOptions,
            selectedValues: statusFilter,
            onSelectionChange: onStatusChange,
          },
        ]}
        onReset={onReset}
        showReset={showReset}
      />

      {/* RIGHT — Actions */}
      <div className="flex items-center gap-2">
        {/* Date Range Picker */}
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={onFromDateChange}
          onToDateChange={onToDateChange}
          onReset={onDateReset}
        />

        {/* Action Buttons */}
        <ActionButtons 
          onDownload={onDownload}
          onUpload={onUpload}
        />
      </div>
    </div>
  );
};

export default DesktopFilters;