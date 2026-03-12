import { useState } from "react";
import { User, Store, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const roles = [
  {
    id: "customer",
    name: "Customer",
    icon: User,
    description: "Browse and purchase products",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    softBg: "#eff6ff",
    iconBg: "#dbeafe",
    iconColor: "#1d4ed8",
    accentColor: "#3b82f6",
    borderHover: "#93c5fd",
    glowColor: "rgba(59,130,246,0.18)",
  },
  {
    id: "vendor",
    name: "Vendor",
    icon: Store,
    description: "Manage your store and products",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    softBg: "#f5f3ff",
    iconBg: "#ede9fe",
    iconColor: "#6d28d9",
    accentColor: "#8b5cf6",
    borderHover: "#c4b5fd",
    glowColor: "rgba(139,92,246,0.18)",
  },
  {
    id: "admin",
    name: "Admin",
    icon: ShieldCheck,
    description: "Full system administration",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
    softBg: "#fff1f2",
    iconBg: "#ffe4e6",
    iconColor: "#be123c",
    accentColor: "#f43f5e",
    borderHover: "#fda4af",
    glowColor: "rgba(244,63,94,0.18)",
  },
];

type Role = (typeof roles)[number];

interface RoleSwitchModalProps {
  open: boolean;
  currentRole: string;
  onClose: () => void;
  onSwitch: (roleName: string) => void;
}

const RoleSwitchModal = ({ open, currentRole, onClose, onSwitch }: RoleSwitchModalProps) => {
  const [confirmRole, setConfirmRole] = useState<Role | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [progress, setProgress]       = useState(0);
  const [hoveredId, setHoveredId]     = useState<string | null>(null);

  const handleClose = () => {
    setConfirmRole(null);
    setIsSwitching(false);
    setProgress(0);
    onClose();
  };

  const confirmSwitch = () => {
    if (!confirmRole) return;
    setIsSwitching(true);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 14 + 8;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          onSwitch(confirmRole.name);
          setIsSwitching(false);
          setProgress(0);
          setConfirmRole(null);
          onClose();
        }, 350);
      }
      setProgress(Math.min(p, 100));
    }, 110);
  };

  const activeRole = roles.find((r) => r.name === currentRole);

  // ─── SWITCHING SCREEN ─────────────────────────────────────────────────────
  if (isSwitching && confirmRole) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[360px] p-0 overflow-hidden border-0"
          style={{ borderRadius: 24, boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}
        >
          {/* Gradient hero */}
          <div
            style={{ background: confirmRole.gradient, position: "relative", overflow: "hidden" }}
            className="px-8 py-10 flex flex-col items-center gap-4"
          >
            {/* Decorative circles */}
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center", pointerEvents: "none"
            }}>
              <div style={{ width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)" }} />
              <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
            </div>
            <div
              style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}
              className="animate-pulse"
            >
              <confirmRole.icon style={{ width: 34, height: 34, color: "#fff", strokeWidth: 1.5 }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 }}>Switching to</p>
              <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginTop: 2 }}>{confirmRole.name}</h2>
            </div>
          </div>

          {/* Progress */}
          <div style={{ background: "#fff", padding: "20px 24px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Loading workspace
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: confirmRole.accentColor }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: confirmRole.gradient,
                borderRadius: 99, width: `${progress}%`, transition: "width 0.12s ease"
              }} />
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 10, textAlign: "center" }}>
              Setting up your {confirmRole.name} environment…
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── CONFIRM SCREEN ───────────────────────────────────────────────────────
  if (confirmRole && !isSwitching) {
    return (
      <Dialog open={true} onOpenChange={() => setConfirmRole(null)}>
        <DialogContent
          className="sm:max-w-[360px] p-0 overflow-hidden border-0"
          style={{ borderRadius: 24, boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}
        >
          <div
            style={{ background: confirmRole.gradient, position: "relative", overflow: "hidden" }}
            className="px-8 py-8 flex flex-col items-center gap-3"
          >
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center", pointerEvents: "none"
            }}>
              <div style={{ width: 160, height: 160, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)" }} />
              <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
            </div>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <confirmRole.icon style={{ width: 28, height: 28, color: "#fff", strokeWidth: 1.75 }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>Switch to {confirmRole.name}?</h2>
              <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 4 }}>{confirmRole.description}</p>
            </div>
          </div>

          <div style={{ background: "#fff", padding: "20px 20px 20px" }}>
            {/* Info box */}
            <div style={{
              background: confirmRole.softBg, border: `1px solid ${confirmRole.borderHover}`,
              borderRadius: 12, padding: "12px 14px", marginBottom: 16,
              display: "flex", alignItems: "flex-start", gap: 10
            }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: confirmRole.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <CheckCircle2 style={{ width: 11, height: 11, color: confirmRole.iconColor }} />
              </div>
              <p style={{ fontSize: 12, color: confirmRole.iconColor, lineHeight: 1.5 }}>
                Switching to <strong>{confirmRole.name}</strong>. Your current session is saved — you can switch back anytime.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmRole(null)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "1.5px solid #e5e7eb",
                  background: "#fff", fontSize: 13, fontWeight: 700, color: "#6b7280", cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitch}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
                  background: confirmRole.gradient, fontSize: 13, fontWeight: 700,
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6
                }}
              >
                Confirm
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── ROLE LIST ─────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[420px] p-0 overflow-hidden border-0"
        style={{ borderRadius: 24, boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}
      >

        {/* ── Header ── */}
        <div style={{ background: "#fff", padding: "22px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>Switch Role</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 3 }}>Choose how you want to continue</p>
            </div>
            {/* Current role pill */}
            {activeRole && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 99,
                background: activeRole.softBg, border: `1px solid ${activeRole.borderHover}`,
                fontSize: 11, fontWeight: 700, color: activeRole.iconColor
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: activeRole.accentColor }} />
                {activeRole.name}
              </div>
            )}
          </div>
        </div>

        {/* ── Cards ── */}
        <div style={{ background: "#f8fafc", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = currentRole === role.name;
            const isHovered = hoveredId === role.id;

            return (
              <button
                key={role.id}
                onClick={() => !isActive && setConfirmRole(role)}
                onMouseEnter={() => !isActive && setHoveredId(role.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={isActive}
                style={{
                  width: "100%", textAlign: "left", border: "none",
                  padding: 0, background: "transparent", cursor: isActive ? "default" : "pointer"
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 16,
                  border: `2px solid ${isActive ? "transparent" : isHovered ? role.borderHover : "#e5e7eb"}`,
                  background: isActive ? role.gradient : "#fff",
                  boxShadow: isActive
                    ? `0 8px 24px ${role.glowColor}`
                    : isHovered ? `0 4px 16px ${role.glowColor}` : "0 1px 4px rgba(0,0,0,0.04)",
                  transition: "all 0.15s ease",
                  transform: isHovered && !isActive ? "translateY(-1px)" : "none",
                }}>

                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isActive ? "rgba(255,255,255,0.2)" : role.iconBg,
                  }}>
                    <Icon style={{
                      width: 22, height: 22, strokeWidth: 1.75,
                      color: isActive ? "#fff" : role.iconColor
                    }} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 15, fontWeight: 800,
                        color: isActive ? "#fff" : "#111827"
                      }}>
                        {role.name}
                      </span>
                      {isActive && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 10, fontWeight: 700, color: "#fff",
                          background: "rgba(255,255,255,0.22)", borderRadius: 99,
                          padding: "2px 8px"
                        }}>
                          <CheckCircle2 style={{ width: 10, height: 10 }} />
                          Active
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: 12, marginTop: 2,
                      color: isActive ? "rgba(255,255,255,0.72)" : "#9ca3af",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                      {role.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  {!isActive && (
                    <ArrowRight style={{
                      width: 16, height: 16, flexShrink: 0,
                      color: isHovered ? role.accentColor : "#d1d5db",
                      transform: isHovered ? "translateX(2px)" : "none",
                      transition: "all 0.15s ease",
                      opacity: isHovered ? 1 : 0.5,
                    }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div style={{ background: "#fff", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
          <button
            onClick={handleClose}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 14,
              border: "1.5px solid #e5e7eb", background: "#fff",
              fontSize: 13, fontWeight: 700, color: "#6b7280",
              cursor: "pointer", transition: "all 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSwitchModal;