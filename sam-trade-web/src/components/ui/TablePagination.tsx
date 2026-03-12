import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

const TablePagination = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: TablePaginationProps) => {
  return (
    <div className="flex items-center justify-center gap-4 py-3 border-t border-border">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={currentPage <= 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </Button>
      
      <span className="text-sm text-muted-foreground">
        {currentPage} out of {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default TablePagination;
