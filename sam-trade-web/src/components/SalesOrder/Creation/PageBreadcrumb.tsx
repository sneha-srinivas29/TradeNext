import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, FileText } from "lucide-react";

interface PageBreadcrumbProps {
  onBack:       () => void;
  onOpenDrafts: () => void;
}

const PageBreadcrumb = ({ onBack, onOpenDrafts }: PageBreadcrumbProps) => (
  <div className="sticky top-14 z-20 bg-gray-100 border-t border-gray-200 border-b border-gray-300 shadow-sm">
    <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
              Create Sales Order
            </h1>
            <div className="flex items-center gap-0.5 text-xs mt-0.5 whitespace-nowrap overflow-hidden">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <Link to="/sales-orders/listing" className="text-gray-500 hover:text-gray-900 transition-colors">
                Sales Orders
              </Link>
              <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-gray-900 font-semibold">Create</span>
            </div>
          </div>
        </div>
        <button
          onClick={onOpenDrafts}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-300 transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Drafts</span>
        </button>
      </div>
    </div>
  </div>
);

export default PageBreadcrumb;