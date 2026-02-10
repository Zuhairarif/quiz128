import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { adminApi } from "@/lib/api";

type AdminContextType = {
  isAdmin: boolean;
  loading: boolean;
  login: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  loading: true,
  login: async () => ({ success: false }),
  logout: () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      adminApi.verify(token).then((res) => {
        setIsAdmin(res.valid === true);
        if (!res.valid) localStorage.removeItem("admin_token");
        setLoading(false);
      }).catch(() => {
        setIsAdmin(false);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (userId: string, password: string) => {
    const res = await adminApi.login(userId, password);
    if (res.success && res.token) {
      localStorage.setItem("admin_token", res.token);
      setIsAdmin(true);
      return { success: true };
    }
    return { success: false, error: res.error || "Invalid credentials" };
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
