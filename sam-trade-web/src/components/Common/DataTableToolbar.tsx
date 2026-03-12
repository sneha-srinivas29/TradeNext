import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FacetedFilter } from "@/components/Common/FacetedFilter";

interface FilterOption {
    label: string;
    value: string;
}

interface Filter {
    id: string;
    title: string;
    options: FilterOption[];
    selectedValues: Set<string>;
    onSelectionChange: (values: Set<string>) => void;
}

interface DataTableToolbarProps {
    filterValue: string;
    onFilterChange: (value: string) => void;
    filterPlaceholder?: string;
    filters?: Filter[];
    onReset?: () => void;
    showReset?: boolean;
}

export function DataTableToolbar({
    filterValue,
    onFilterChange,
    filterPlaceholder = "Filter...",
    filters = [],
    onReset,
    showReset = false,
}: DataTableToolbarProps) {
    const hasActiveFilters = showReset || filters.some((f) => f.selectedValues.size > 0);

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder={filterPlaceholder}
                    value={filterValue}
                    onChange={(e) => onFilterChange(e.target.value)}
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                {filters.map((filter) => (
                    <FacetedFilter
                        key={filter.id}
                        title={filter.title}
                        options={filter.options}
                        selectedValues={filter.selectedValues}
                        onSelectionChange={filter.onSelectionChange}
                    />
                ))}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        onClick={onReset}
                        className="
    h-8 px-2 lg:px-3
    hover:bg-gray-200
    hover:text-gray-900
  "
                    >
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
