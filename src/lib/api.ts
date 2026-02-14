const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const adminApi = {
  async login(user_id: string, password: string) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", user_id, password }),
    });
    return res.json();
  },

  async verify(token: string) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", token }),
    });
    return res.json();
  },

  async quizAction(action: string, data: Record<string, unknown> = {}) {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-quizzes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token || "",
      },
      body: JSON.stringify({ action, ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  },

  async extractQuiz(pdfBase64: string, fileName: string) {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${SUPABASE_URL}/functions/v1/extract-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token || "",
      },
      body: JSON.stringify({ pdf_base64: pdfBase64, file_name: fileName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Extraction failed");
    }
    return res.json();
  },

  async submitQuiz(quizId: string, userName: string, answers: Record<string, string>, timeTakenSeconds: number, userAddress?: string, userPhone?: string, studentProfileId?: string) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: quizId,
        user_name: userName,
        user_address: userAddress || null,
        user_phone: userPhone || null,
        student_profile_id: studentProfileId || null,
        answers,
        time_taken_seconds: timeTakenSeconds,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Submission failed");
    }
    return res.json();
  },
};
