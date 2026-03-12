import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter } from "lucide-react";
import { StatusOption } from "./itemfulfillment.type";

interface StatusFilterProps {
  statusFilter: Set<string>;
  onStatusChange: (statusFilter: Set<string>) => void;
  statusOptions: StatusOption[];
  showLabel?: boolean;
}

const StatusFilter = ({ 
  statusFilter, 
  onStatusChange, 
  statusOptions,
  showLabel = true 
}: StatusFilterProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-border/60 shadow-sm"
        >
          <Filter className="h-4 w-4" />
          {showLabel && <span className="ml-2">Status</span>}
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
  );
};

export default StatusFilter;