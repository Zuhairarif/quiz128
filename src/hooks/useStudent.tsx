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
  loginWithPhone: (phone: string) => Promise<StudentProfile>;
  registerWithPhone: (phone: string, name: string, address: string) => Promise<StudentProfile>;
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

  // Login: phone only, must already be registered
  const loginWithPhone = useCallback(async (phone: string): Promise<StudentProfile> => {
    const { data: existing } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("phone_number", phone)
      .single();

    if (!existing) {
      throw new Error("Phone number not registered. Please register first.");
    }

    const profile = existing as StudentProfile;
    setStudent(profile);
    localStorage.setItem("student_phone", phone);
    return profile;
  }, []);

  // Register: phone + name + address, all mandatory
  const registerWithPhone = useCallback(async (phone: string, name: string, address: string): Promise<StudentProfile> => {
    // Check if already exists
    const { data: existing } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("phone_number", phone)
      .single();

    if (existing) {
      throw new Error("This phone number is already registered. Please login instead.");
    }

    const { data: newProfile, error } = await supabase
      .from("student_profiles")
      .insert({ phone_number: phone, full_name: name, address })
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
    <StudentContext.Provider value={{ student, loading, loginWithPhone, registerWithPhone, logout, isLoggedIn: !!student }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
