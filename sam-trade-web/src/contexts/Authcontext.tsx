

// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useCallback,
//   ReactNode,
// } from "react";
// import {
//   getCurrentUser,
//   login as authLogin,
//   logout as authLogout,
//   type User,
// } from "@/components/utils/authUtils";

// interface AuthContextType {
//   user: User | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<User>;
//   logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // ─── Initial auth check (runs ONCE on app load) ───────────────────────────
//   useEffect(() => {
//     let cancelled = false;

//     // 1️⃣ Hydrate from sessionStorage for instant UI (no flicker)
//     const cachedRaw = sessionStorage.getItem("user");
//     if (cachedRaw) {
//       try {
//         const cachedUser = JSON.parse(cachedRaw);
//         if (!cancelled) setUser(cachedUser);
//       } catch {
//         sessionStorage.removeItem("user");
//       }
//     }

//     // 2️⃣ Validate session with backend (authoritative check)
//     //    This will 401 when not logged in — that's expected and handled silently.
//     const initAuth = async () => {
//       try {
//         const fetchedUser = await getCurrentUser();
//         if (!cancelled) {
//           if (fetchedUser) {
//             setUser(fetchedUser);
//             sessionStorage.setItem("user", JSON.stringify(fetchedUser));
//           } else {
//             // getCurrentUser returned null (401) — not logged in
//             setUser(null);
//             sessionStorage.removeItem("user");
//           }
//         }
//       } catch {
//         if (!cancelled) {
//           setUser(null);
//           sessionStorage.removeItem("user");
//         }
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     };

//     initAuth();

//     return () => { cancelled = true; };
//   }, []);

//   // ─── Login ────────────────────────────────────────────────────────────────
//   const login = useCallback(
//     async (email: string, password: string): Promise<User> => {
//       // authLogin() now returns the user directly from the login response body.
//       // It no longer calls getCurrentUser() — no race condition with Set-Cookie.
//       const loggedInUser = await authLogin(email, password);

//       // Persist + update state
//       sessionStorage.setItem("user", JSON.stringify(loggedInUser));
//       setUser(loggedInUser);

//       return loggedInUser;
//     },
//     []
//   );

//   // ─── Logout ───────────────────────────────────────────────────────────────
//   const logout = useCallback(async () => {
//     setUser(null);
//     sessionStorage.removeItem("user");
//     await authLogout();
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         isAuthenticated: !!user,
//         isLoading,
//         login,
//         logout,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = (): AuthContextType => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) {
//     throw new Error("useAuth must be used inside AuthProvider");
//   }
//   return ctx;
// };

/**
 * AuthContext — SESSION EXPIRY PATCH
 * ─────────────────────────────────────────────────────────────────
 * Add this block inside your existing AuthContext provider's
 * initialization useEffect (the one that runs on mount to restore
 * the user from storage).
 *
 * PROBLEM FIXED: User stays logged in forever after closing the browser
 * because auth state is in localStorage which never expires.
 *
 * SOLUTION: On every app boot we check loginTimestamp.  If it's older
 * than MAX_SESSION_MS (8 hours, configurable) we clear everything and
 * force the user back to login.
 *
 * ─── HOW TO APPLY ────────────────────────────────────────────────
 *
 * In your Authcontext.tsx, find the useEffect that runs on mount
 * (the one that calls something like setUser(storedUser)) and add
 * the session-expiry check BEFORE restoring the user.
 *
 * Example — your existing init effect probably looks like:
 *
 *   useEffect(() => {
 *     const storedUser = JSON.parse(localStorage.getItem("user") || "null");
 *     if (storedUser) {
 *       setUser(storedUser);          // ← USER ALWAYS RESTORED
 *       setIsAuthenticated(true);
 *     }
 *     setIsLoading(false);
 *   }, []);
 *
 * Change it to:
 *
 *   useEffect(() => {
 *     const storedUser = JSON.parse(localStorage.getItem("user") || "null");
 *     if (storedUser) {
 *       //   ADD THIS CHECK ──────────────────────────────────────
 *       if (!isSessionAlive()) {
 *         clearAllCaches();
 *         // Don't restore user — fall through to setIsLoading(false)
 *         setIsLoading(false);
 *         return;
 *       }
 *       // ────────────────────────────────────────────────────────
 *       setUser(storedUser);
 *       setIsAuthenticated(true);
 *     }
 *     setIsLoading(false);
 *   }, []);
 *
 * Also make sure your logout() function calls clearAllCaches():
 *
 *   const logout = () => {
 *     clearAllCaches();          // ← ADD THIS
 *     setUser(null);
 *     setIsAuthenticated(false);
 *     navigate("/login");
 *   };
 *
 * ─────────────────────────────────────────────────────────────────
 * The isSessionAlive() and clearAllCaches() imports come from
 * cacheManager.ts (the new file in this PR).
 */

// ── Paste these imports at the top of your Authcontext.tsx ────────────────────

import { isSessionAlive, clearAllCaches, stampLoginTime } from "../components/utils/cacheManager"

// ── Export stampLoginTime so Login.tsx can call it after success ──────────────
export { stampLoginTime };

/**
 * Full drop-in AuthContext for reference.
 * Adjust to match your existing shape — the key additions are marked  
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id:                  string;
  name:                string;
  email:               string;
  role?:               string;
  roleName?:           string;
  netsuiteCustomerId?: string;
  [key: string]: any;
}

interface AuthContextType {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:           (email: string, password: string) => Promise<User>;
  logout:          () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user,            setUser]            = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading,       setIsLoading]       = useState(true);

  // ── Restore session on boot ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const storedUser = JSON.parse(raw) as User;

        //   Session expiry check — auto-logout if session is too old
        if (!isSessionAlive()) {
          clearAllCaches();
          setIsLoading(false);
          return;
        }

        setUser(storedUser);
        setIsAuthenticated(true);
      }
    } catch {
      clearAllCaches();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<User> => {
    const base = ((import.meta as any).env.VITE_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");
    const res  = await fetch(`${base}/auth/login`, {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || "Login failed");
    }

    const data = await res.json();
    const loggedInUser: User = data.user || data;

    //   Persist user + stamp login time
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    stampLoginTime(); // ← records Date.now() for session expiry

    setUser(loggedInUser);
    setIsAuthenticated(true);

    return loggedInUser;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    //   Wipe all caches — user cannot get stale data on re-login
    clearAllCaches();
    localStorage.removeItem("user");

    setUser(null);
    setIsAuthenticated(false);

    // Navigate to login — use window.location so the SPA fully resets
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;