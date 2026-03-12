import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter } from "lucide-react";
import { StatusOption } from "./Purchasebill.types"
import DateRangePicker from "../../Common/Daterangefilter";
import ActionButtons from "./Actionbuttons";

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
  onDownload: () => void;
  onUpload: () => void;
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
  onDownload,
  onUpload,
}: MobileFiltersProps) => {
  return (
    <div className="sm:hidden space-y-3 mb-6">
      {/* Row 1: Search Input */}
      <div className="w-full">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      {/* Row 2: Status, Date, Download, Upload */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-border/60 shadow-sm"
            >
              <Filter className="h-4 w-4" />
              {statusFilter.size > 0 && (
                <span className="ml-1 text-xs">({statusFilter.size})</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <div className="p-3 space-y-2">
              <div className="font-medium text-sm">Status</div>
              {statusOptions.map((option) => (
                <label 
                  key={option.value} 
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={statusFilter.has(option.value)}
                    onChange={(e) => {
                      const newSet = new Set(statusFilter);
                      if (e.target.checked) {
                        newSet.add(option.value);
                      } else {
                        newSet.delete(option.value);
                      }
                      onStatusChange(newSet);
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

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
          compact={true}
        />
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