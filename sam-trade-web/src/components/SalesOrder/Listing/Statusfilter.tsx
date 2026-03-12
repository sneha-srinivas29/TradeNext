

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export const statusOptions = [
  { label: "Pending Approval", value: "Pending Approval" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

interface StatusFilterProps {
  statusFilter: Set<string>;
  setStatusFilter: (v: Set<string>) => void;
}

export const StatusFilter = ({ statusFilter, setStatusFilter }: StatusFilterProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="sm" className="h-9 border-border/60 shadow-sm">
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
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={statusFilter.has(option.value)}
              onChange={(e) => {
                const newSet = new Set(statusFilter);
                e.target.checked ? newSet.add(option.value) : newSet.delete(option.value);
                setStatusFilter(newSet);
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