import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  CheckSquare,
  FileText,
  Receipt,
  RefreshCw,
  Calendar,
  X,
  PanelLeft,
  HandCoins,
  PanelLeftClose,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Sales Orders", icon: ShoppingCart, path: "/sales-orders/listing" },
  { name: "Purchase Orders", icon: Package, path: "/purchase-orders/listing" },
  { name: "Item Fulfillments", icon: CheckSquare, path: "/item-fulfillments/listing/:soId?" },
  { name: "Sale Invoices", icon: FileText, path: "/sales-invoices" },
  { name: "Goods Received Note", icon: HandCoins, path: "/grn-listing" },
  { name: "Purchase Bills", icon: Receipt, path: "/purchase-bills/listing" },
  { name: "Repayment", icon: RefreshCw, path: "/repayment" },
  { name: "Ageing Module", icon: Calendar, path: "/ageing-module" },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, isCollapsed, close, toggle } = useSidebar();

  const isActive = (path: string) => {
    // Remove optional parameter syntax from path for comparison
    const cleanPath = path.replace('/:soId?', '');

    // Exact match for dashboard
    if (cleanPath === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    // For other routes, check if pathname starts with the path
    return location.pathname.startsWith(cleanPath);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 left-0 z-40
          h-[calc(100vh-3.5rem)] flex flex-col
          bg-sidebar text-sidebar-foreground
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-16" : "lg:w-56"}
          w-64 shadow-xl lg:shadow-none
        `}
      >
        {/* Mobile Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          className="absolute top-3 right-3 lg:hidden"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-3 border-b border-sidebar-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
            >
              <PanelLeft className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {navItems.map((item, index) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              const isDashboard = index === 0;

              return (
                <Button
                  key={item.name}
                  variant={active ? "secondary" : "ghost"}
                  onClick={() => {
                    navigate(item.path.replace('/:soId?', ''));
                    if (window.innerWidth < 1024) close();
                  }}
                  className={`
                    w-full justify-start px-3 py-2.5 gap-3
                    ${active
                      ? "bg-white text-primary hover:bg-white/90"
                      : "hover:bg-white hover:text-primary"}
                    ${isCollapsed ? "lg:justify-center lg:px-2" : ""}
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />

                  <span
                    className={`
                      truncate whitespace-nowrap text-sm font-medium
                      ${isCollapsed ? "lg:hidden" : ""}
                    `}
                  >
                    {item.name}
                  </span>

                  {!isCollapsed && isDashboard && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle();
                      }}
                      className="ml-auto hidden lg:flex h-6 w-6 items-center justify-center rounded hover:bg-sidebar-accent/50"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default Sidebar;