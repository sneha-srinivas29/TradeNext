import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

interface SimpleFilterProps {
  label: string;
  options: FilterOption[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  showIcon?: boolean;
}

export const SimpleFilter = ({
  label,
  options,
  selected,
  onChange,
  showIcon = true,
}: SimpleFilterProps) => {
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const newSet = new Set(selected);
    if (checked) {
      newSet.add(optionValue);
    } else {
      newSet.delete(optionValue);
    }
    onChange(newSet);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-border/60 shadow-sm"
        >
          {showIcon && <Filter className="h-4 w-4 mr-2" />}
          {label}
          {selected.size > 0 && (
            <span className="ml-1 text-xs">({selected.size})</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="p-3 space-y-2">
          <div className="font-medium text-sm">{label}</div>
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded-md transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(option.value)}
                onChange={(e) =>
                  handleCheckboxChange(option.value, e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};