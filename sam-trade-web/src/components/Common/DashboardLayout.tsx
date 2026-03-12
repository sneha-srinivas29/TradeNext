import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSidebar } from "@/contexts/SidebarContext";

interface DashboardLayoutProps {
  children:       ReactNode;
  userName?:      string;
  stickyHeader?:  ReactNode; //   renders above the padded area — sticky works
}

const DashboardLayout = ({
  children,
  userName      = "Shine Agrotechnology",
  stickyHeader,
}: DashboardLayoutProps) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header  showSidebar={true} />

      <main
        className={`pt-14 min-h-screen transition-all duration-300 ${
          isCollapsed ? "lg:ml-16" : "lg:ml-56"
        }`}
      >
        {/* Sticky content (breadcrumbs, sub-headers) renders here — no padding */}
        {stickyHeader}

        <div className="p-3 md:p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;