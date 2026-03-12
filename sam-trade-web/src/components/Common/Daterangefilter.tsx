import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onReset: () => void;
  isMobile?: boolean;
}

const DateRangeFilter = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onReset,
  isMobile = false,
}: DateRangeFilterProps) => {
  const isValidDate = (dateStr: string) => {
    const parsed = parse(dateStr, "dd-MM-yyyy", new Date());
    return isValid(parsed);
  };

  const displayText = isMobile
    ? `${fromDate.split("-")[0]}/${fromDate.split("-")[1]} - ${toDate.split("-")[0]}/${toDate.split("-")[1]}`
    : `${fromDate} to ${toDate}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 border-border/60 shadow-sm justify-start text-left font-normal hover:bg-gray-200 data-[state=open]:bg-gray-200",
            isMobile && "flex-1"
          )}
        >
          <Calendar className={cn(
            "h-4 w-4 text-muted-foreground",
            isMobile ? "mr-2 flex-shrink-0" : "mr-2"
          )} />
          <span className={cn(isMobile ? "text-xs truncate" : "text-sm")}>
            {displayText}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover border-border/60 shadow-lg" align="start">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Select Date Range</h4>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`from-date-${isMobile ? 'mobile' : 'desktop'}`} className="text-sm">
                From Date
              </Label>
              <Input
                id={`from-date-${isMobile ? 'mobile' : 'desktop'}`}
                placeholder="DD-MM-YYYY"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className={cn(
                  "h-9 text-sm",
                  !isValidDate(fromDate) && fromDate !== "" && "border-destructive"
                )}
              />
              {!isValidDate(fromDate) && fromDate !== "" && (
                <p className="text-xs text-destructive">Invalid date format (use DD-MM-YYYY)</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`to-date-${isMobile ? 'mobile' : 'desktop'}`} className="text-sm">
                To Date
              </Label>
              <Input
                id={`to-date-${isMobile ? 'mobile' : 'desktop'}`}
                placeholder="DD-MM-YYYY"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className={cn(
                  "h-9 text-sm",
                  !isValidDate(toDate) && toDate !== "" && "border-destructive"
                )}
              />
              {!isValidDate(toDate) && toDate !== "" && (
                <p className="text-xs text-destructive">Invalid date format (use DD-MM-YYYY)</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
            >
              Reset
            </Button>
            <Button
              size="sm"
              disabled={!isValidDate(fromDate) || !isValidDate(toDate)}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeFilter;