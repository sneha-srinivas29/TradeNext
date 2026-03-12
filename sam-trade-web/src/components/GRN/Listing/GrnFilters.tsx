import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Filter, X } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSection {
  key: string;
  label: string;
  options: FilterOption[];
}

interface GrnFiltersProps {
  filters: Record<string, Set<string>>;
  filterSections: FilterSection[];
  onFilterChange: (key: string, value: Set<string>) => void;
  onClearAll: () => void;
}

export const GrnFilters = ({
  filters,
  filterSections,
  onFilterChange,
  onClearAll,
}: GrnFiltersProps) => {
  const totalActiveFilters = Object.values(filters).reduce(
    (sum, filterSet) => sum + filterSet.size,
    0
  );

  const handleCheckboxChange = (
    sectionKey: string,
    optionValue: string,
    checked: boolean
  ) => {
    const currentFilter = filters[sectionKey] || new Set();
    const newFilter = new Set(currentFilter);
    
    if (checked) {
      newFilter.add(optionValue);
    } else {
      newFilter.delete(optionValue);
    }
    
    onFilterChange(sectionKey, newFilter);
  };

  const clearSectionFilter = (sectionKey: string) => {
    onFilterChange(sectionKey, new Set());
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-border/60 shadow-sm"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {totalActiveFilters > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs"
            >
              {totalActiveFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Header with Clear All */}
          <div className="flex items-center justify-between sticky top-0 bg-popover pb-2 z-10">
            <h4 className="font-semibold text-sm">Filter Options</h4>
            {totalActiveFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>

          <Separator />

          {/* Dynamic Filter Sections */}
          {filterSections.map((section, index) => (
            <div key={section.key}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{section.label}</Label>
                  {filters[section.key]?.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearSectionFilter(section.key)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {section.options.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded-md transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters[section.key]?.has(option.value) || false}
                        onChange={(e) =>
                          handleCheckboxChange(
                            section.key,
                            option.value,
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {index < filterSections.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};