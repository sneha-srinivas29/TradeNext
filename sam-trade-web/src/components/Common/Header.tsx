import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/Authcontext";
import Samunnati from "../../assets/Samunnati.jpg";
import { Bell, Menu, Moon, Sun, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "./Usermenu";
import GlobalSearch from "./Globalsearch";
import RoleSwitchModal from "./Roleswitchmodal";

interface HeaderProps {
  showSidebar?: boolean;
}

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Contact Us", path: "/contact" },
  { label: "Our Solutions", path: "/solutions" },
  { label: "Impact Stories", path: "/impact" },
  { label: "Partner Programs", path: "/partners" },
];

const Header = ({ showSidebar = true }: HeaderProps) => {
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);
  const [currentRole, setCurrentRole] = useState("Customer");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const { toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { user, isLoading } = useAuth();

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <header
        style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}
        className="fixed left-0 top-0 z-50 w-full h-14 shadow-sm"
      >
        <div className="flex h-full items-center px-6">
          <img src={Samunnati} alt="Samunnati" className="h-9 w-auto object-contain" />
        </div>
      </header>
    );
  }

  // ─── PUBLIC HEADER ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <header
        style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}
        className="fixed left-0 top-0 z-50 w-full shadow-sm"
      >
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => navigate("/")}>
            <img src={Samunnati} alt="Samunnati" className="h-10 w-auto object-contain" />
          </div>
          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
            {navLinks.map((link) => (
              <button key={link.path} onClick={() => navigate(link.path)}
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
                {link.label}
              </button>
            ))}
          </nav>
          <div className="hidden md:flex flex-shrink-0">
            <Button onClick={() => navigate("/login")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 rounded-md">
              Login
            </Button>
          </div>
          <button className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-5 flex flex-col gap-3 shadow-md">
            {navLinks.map((link) => (
              <button key={link.path}
                onClick={() => { navigate(link.path); setMobileOpen(false); }}
                className="text-left text-sm font-medium text-gray-700 hover:text-primary py-1.5 border-b border-gray-50 last:border-0">
                {link.label}
              </button>
            ))}
            <Button onClick={() => { navigate("/login"); setMobileOpen(false); }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-md w-full mt-1">
              Login
            </Button>
          </div>
        )}
      </header>
    );
  }

  // ─── AUTHENTICATED ─────────────────────────────────────────────────────────
  const activeRole = user.roleName ?? user.role ?? currentRole;

  const roleColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    Admin: { bg: "#fff1f2", text: "#be123c", border: "#fda4af", dot: "#f43f5e" },
    Vendor: { bg: "#f5f3ff", text: "#6d28d9", border: "#c4b5fd", dot: "#7c3aed" },
    Customer: { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd", dot: "#3b82f6" },
    BUYER_SUPPLIER: { bg: "#f0fdf4", text: "#15803d", border: "#86efac", dot: "#22c55e" },
  };
  const rc = roleColors[activeRole] ?? roleColors.Customer;

  return (
    <>
      <header
        style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}
        className="fixed left-0 top-0 z-50 w-full h-14 shadow-sm"
      >
        {/* ══ MOBILE ══════════════════════════════════════════════════════════ */}
        <div className="flex sm:hidden h-full items-center px-3 gap-2">
          {showSidebar && (
            <button onClick={toggle} style={{ color: "#374151" }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Toggle sidebar">
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1" />

          {/* Mobile search — GlobalSearch handles its own icon */}
          <GlobalSearch onSearch={async () => []} onSelect={() => { }} />

          <button onClick={() => navigate("/notification")} style={{ color: "#374151" }}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex-shrink-0">
            <UserMenu onRoleSwitchOpen={() => setShowRoleSwitch(true)} />
          </div>
        </div>

        {/* ══ DESKTOP ═════════════════════════════════════════════════════════ */}
        <div className="hidden sm:flex h-full items-center px-4 lg:px-6 relative">

          {/* LEFT: logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {showSidebar && (
              <button onClick={toggle} style={{ color: "#374151" }}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Toggle sidebar">
                <Menu className="h-5 w-5" />
              </button>
            )}
            <img src={Samunnati} alt="Samunnati" className="h-9 w-auto object-contain flex-shrink-0" />
            <div style={{ width: "1px", height: "24px", background: "#e5e7eb", flexShrink: 0 }} />
          </div>

          {/* CENTER: search — truly centered via absolute */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(560px, 44vw)",
            }}
          >

            <div style={{ flex: 1, minWidth: 0 }}>
              <GlobalSearch onSearch={async () => []} onSelect={() => { }} />
            </div>

          </div>

          {/* RIGHT: role + theme + notif + avatar */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">

            {/* Role pill */}
            <button
              onClick={() => setShowRoleSwitch(true)}
              style={{
                background: rc.bg,
                color: rc.text,
                border: `1px solid ${rc.border}`,
                borderRadius: "999px",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                flexShrink: 0,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: rc.dot, flexShrink: 0 }} />
              {activeRole}
              <ChevronDown style={{ width: 12, height: 12, opacity: 0.55 }} />
            </button>

            {/* Theme */}
            <button onClick={toggleTheme} style={{ color: "#374151" }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Toggle theme">
              {theme === "light"
                ? <Moon className="h-[18px] w-[18px]" />
                : <Sun className="h-[18px] w-[18px]" />}
            </button>

            {/* Notifications */}
            <button onClick={() => navigate("/notification")} style={{ color: "#374151" }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            {/* Avatar */}
            <UserMenu onRoleSwitchOpen={() => setShowRoleSwitch(true)} />
          </div>
        </div>
      </header>

      <RoleSwitchModal
        open={showRoleSwitch}
        currentRole={activeRole}
        onClose={() => setShowRoleSwitch(false)}
        onSwitch={(roleName) => setCurrentRole(roleName)}
      />
    </>
  );
};

export default Header;