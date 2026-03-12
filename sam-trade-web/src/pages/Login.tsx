// //
//  * ────────────────────
//  * 1. AUTO-LOGOUT after MAX_SESSION_MS (8 h) — uses stampLoginTime() +
//  *    isSessionAlive() from cacheManager.  User is never stuck logged
//  *    in forever after closing the browser.
//  * 2. Prefetch is now delegated to prefetchService.kickoffAllPrefetches()
//  *    — removes the duplicate bgFetchContracts / bgFetchSOListing /
//  *    bgFetchCreationLookups code that lived here before, so contracts
//  *    API is hit ONCE, not twice.
//  * 3. clearAllCaches() on logout path so stale data never bleeds
//  *    between sessions.
//  *//

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Common/Header";
import { useAuth } from "@/contexts/Authcontext";

import { stampLoginTime, isSessionAlive, clearAllCaches } from "../components/utils/cacheManager";
import { kickoffAllPrefetches } from "../components/utils/prefetchService";

import Pulses      from "../assets/Pulses.jpg";
import Agritrading from "../assets/Agritrading.jpg";
import paddy       from "../assets/paddy.jpg";
import logistics   from "../assets/logistics.jpg";

// ─── Role resolution (exported so ContractSelection + AuthContext can reuse) ──
export const resolveRole = (user: any): "admin" | "supplier" | "buyer" => {
  const raw = ((user?.roleName ?? user?.role) || "").toLowerCase().trim();
  if (raw.includes("admin"))                               return "admin";
  if (raw.includes("supplier") || raw.includes("vendor")) return "supplier";
  return "buyer";
};

export const roleToPath = (user: any): string =>
  resolveRole(user) !== "buyer" ? "/dashboard" : "/contract-selection";

// ─────────────────────────────────────────────────────────────────────────────

const Login = () => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [active,   setActive]   = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated, isLoading, logout } = useAuth();

  const slides = [
    { img: Agritrading },
    { img: logistics },
    { img: Pulses },
    { img: paddy },
  ];

  // ─── Image slider ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(
      () => setActive((prev) => (prev + 1) % slides.length),
      2500
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  // ─── Session expiry check on mount ───────────────────────────────────────
  // If the user has a stored auth state but the session is older than
  // MAX_SESSION_MS we silently log them out before they can proceed.
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      if (!isSessionAlive()) {
        // Session expired — wipe everything and stay on login
        clearAllCaches();
        logout?.();
        return;
      }
      // Session is valid — redirect away from login
      const destination = (location.state as any)?.from?.pathname || roleToPath(user);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate, location.state, logout]);

  // ─── Login submit ─────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email.trim(), password);

      //   Stamp the login time — used for session expiry checks
      stampLoginTime();

      //   Navigate FIRST — user reaches the next page instantly
      const destination = roleToPath(loggedInUser);
      navigate(destination, { replace: true });

      //   Prefetch AFTER navigate — fully detached, never blocks UI
      //    This is the ONLY place prefetches are kicked off after login.
      //    prefetchService has in-flight dedup so even if something else
      //    calls these, they won't double-fire.
      kickoffAllPrefetches(loggedInUser);

    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Auth loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (isAuthenticated && user) return null;

  return (
    <>
      <Header showSidebar={false} />

      <div className="flex min-h-[calc(100vh-64px)] mt-16">
        {/* LEFT: Login Form */}
        <div className="flex-1 flex items-center justify-center bg-primary p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h1 className="text-3xl text-primary font-bold mb-2">Welcome back!</h1>
            <p className="text-primary mb-5 text-sm">
              Enter your credentials to access your account
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm text-primary font-medium mb-1.5">
                  Email address or Mobile Number
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or mobile"
                  className="w-full border border-gray-300 p-2 rounded"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-primary text-sm font-medium">Password</label>
                  <button type="button" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-gray-300 p-2 rounded pr-10"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-3 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Logging in...</>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="my-4 text-center text-primary text-sm">Or</div>

            <Button
              type="button"
              className="w-full py-3"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
            >
              Sign in with SSO
            </Button>

            <p className="text-center text-primary text-sm mt-4">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-medium hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT: Image Slider */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-primary p-12">
          <div className="text-center max-w-lg">
            <h2 className="text-3xl font-bold text-white mb-7">
              Making Markets Work for Smallholder Farmers
            </h2>

            <div className="w-72 mx-auto overflow-hidden rounded-lg">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${active * 100}%)` }}
              >
                {slides.map((slide, i) => (
                  <div key={i} className="min-w-full bg-white rounded-md shadow-md p-1">
                    <img
                      src={slide.img}
                      alt={`Slide ${i + 1}`}
                      className="w-full h-44 object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active ? "w-6 bg-yellow-400" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;