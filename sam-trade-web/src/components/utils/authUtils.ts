const BACKEND_BASE =
  (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";

export interface User {
  id:                   string;
  companyId:            string;
  userId:               string;
  email:                string;
  name:                 string;
  role:                 string;
  roleName?:            string;
  companyInternalId:    string;
  netsuiteCustomerId?:  string;
  permissions: {
    canCreateSO: boolean;
    canEditSO:   boolean;
    canViewSO:   boolean;
    canCreatePO: boolean;
    canEditPO:   boolean;
    canViewPO:   boolean;
  };
}

// ─── Core auth calls ──────────────────────────────────────────────────────────

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await fetch(`${BACKEND_BASE}/auth/me`, {
      method:      "GET",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as User;
  } catch {
    return null;
  }
};

export const login = async (email: string, password: string): Promise<User> => {
  const res = await fetch(`${BACKEND_BASE}/auth/login`, {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw data;

  if (data.user) return data.user as User;

  const me = await getCurrentUser();
  if (!me) throw new Error("Login succeeded but could not fetch user profile.");
  return me;
};

export const logout = async (): Promise<void> => {
  try {
    await fetch(`${BACKEND_BASE}/auth/logout`, {
      method:      "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout request failed", err);
  }
  sessionStorage.clear();
  localStorage.removeItem("contracts");
  localStorage.removeItem("selectedContract");
  localStorage.removeItem("selectedContractNo");
  window.location.href = "/login";
};

// ─── Registration ─────────────────────────────────────────────────────────────

export interface RegisterPayload {
  email:             string;
  name:              string;
  password:          string;
  role:              string;
  roleId:            string;
  companyInternalId: string;
  customerId:        string;
}

export const register = async (payload: RegisterPayload): Promise<any> => {
  const res = await fetch(`${BACKEND_BASE}/auth/register`, {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || data?.msg || "Registration failed");
  }

  return data;
};

// ─── Role helpers ─────────────────────────────────────────────────────────────

export const isBuyer = (user: User | null): boolean => {
  const role = ((user?.roleName ?? user?.role) || "").toLowerCase();
  return role === "customer" || role === "buyer" || role.includes("buyer");
};

export const isSupplier = (user: User | null): boolean => {
  const role = ((user?.roleName ?? user?.role) || "").toLowerCase();
  return role === "supplier" || role === "vendor" || role.includes("supplier");
};

// ─── Permission helpers ───────────────────────────────────────────────────────

export const canCreateSO = (user: User | null) => user?.permissions?.canCreateSO ?? false;
export const canEditSO   = (user: User | null) => user?.permissions?.canEditSO   ?? false;
export const canViewSO   = (user: User | null) => user?.permissions?.canViewSO   ?? false;
export const canCreatePO = (user: User | null) => user?.permissions?.canCreatePO ?? false;
export const canEditPO   = (user: User | null) => user?.permissions?.canEditPO   ?? false;
export const canViewPO   = (user: User | null) => user?.permissions?.canViewPO   ?? false;

// ─── Contract listing via backend proxy ──────────────────────────────────────

export const fetchContractListing = async (
  customerID: string | number,
  className  = "BTST",
): Promise<any[] | null> => {
  try {
    const params = new URLSearchParams({
      customerID: String(customerID),
      className,
    });

    const url = `${BACKEND_BASE}/proxy/trade/v1/date-filter-api-for-contract-listing?${params}`;

    const res = await fetch(url, {
      method:      "GET",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error("fetchContractListing failed", res.status, errBody);
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("fetchContractListing error", e);
    return null;
  }
};

// ─── Selected contract helpers ────────────────────────────────────────────────

export const hasSelectedContract = (): boolean =>
  !!localStorage.getItem("selectedContract");

export const getSelectedContract = () => ({
  id: localStorage.getItem("selectedContract"),
  no: localStorage.getItem("selectedContractNo"),
});