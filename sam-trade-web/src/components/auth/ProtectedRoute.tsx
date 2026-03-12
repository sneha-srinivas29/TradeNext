// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/Authcontext";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for /auth/me to settle before making any routing decision.
  // Without this, the router sees isAuthenticated=false during the cookie
  // check and immediately redirects to /login → causing the redirect loop.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;