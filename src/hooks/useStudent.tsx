import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type StudentProfile = {
  id: string;
  phone_number: string;
  full_name: string | null;
  address: string | null;
};

type StudentContextType = {
  student: StudentProfile | null;
  loading: boolean;
  loginWithPhone: (phone: string, name?: string, address?: string) => Promise<StudentProfile>;
  logout: () => void;
  isLoggedIn: boolean;
};

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("student_phone");
    if (stored) {
      supabase
        .from("student_profiles")
        .select("*")
        .eq("phone_number", stored)
        .single()
        .then(({ data }) => {
          if (data) setStudent(data as StudentProfile);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithPhone = useCallback(async (phone: string, name?: string, address?: string): Promise<StudentProfile> => {
    // Try to find existing profile
    const { data: existing } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("phone_number", phone)
      .single();

    if (existing) {
      // Update name/address only if provided
      const updates: Record<string, string> = {};
      if (name && name !== existing.full_name) updates.full_name = name;
      if (address && address !== existing.address) updates.address = address;
      if (Object.keys(updates).length > 0) {
        await supabase.from("student_profiles").update(updates).eq("id", existing.id);
        Object.assign(existing, updates);
      }
      const profile = existing as StudentProfile;
      setStudent(profile);
      localStorage.setItem("student_phone", phone);
      return profile;
    }

    // Create new profile
    const { data: newProfile, error } = await supabase
      .from("student_profiles")
      .insert({ phone_number: phone, full_name: name || null, address: address || null })
      .select()
      .single();

    if (error) throw new Error(error.message);
    const profile = newProfile as StudentProfile;
    setStudent(profile);
    localStorage.setItem("student_phone", phone);
    return profile;
  }, []);

  const logout = useCallback(() => {
    setStudent(null);
    localStorage.removeItem("student_phone");
  }, []);

  return (
    <StudentContext.Provider value={{ student, loading, loginWithPhone, logout, isLoggedIn: !!student }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
