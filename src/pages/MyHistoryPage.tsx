import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useStudent } from "@/hooks/useStudent";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, Clock, LogOut } from "lucide-react";

type Attempt = {
  id: string;
  quiz_id: string;
  score: number;
  total_marks: number;
  correct_count: number;
  wrong_count: number;
  time_taken_seconds: number | null;
  submitted_at: string;
  quizzes: { title: string } | null;
};

export default function MyHistoryPage() {
  const { student, logout, isLoggedIn } = useStudent();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) {
      setLoading(false);
      return;
    }
    supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score, total_marks, correct_count, wrong_count, time_taken_seconds, submitted_at, quizzes(title)")
      .eq("student_profile_id", student.id)
      .order("submitted_at", { ascending: false })
      .then(({ data }) => {
        setAttempts((data as any) || []);
        setLoading(false);
      });
  }, [student]);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p className="text-lg text-muted-foreground">Please log in with your phone number first.</p>
        <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero px-4 pb-6 pt-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground" onClick={() => navigate("/")}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Home
          </Button>
          <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground" onClick={() => { logout(); navigate("/"); }}>
            <LogOut className="mr-1 h-4 w-4" /> Logout
          </Button>
        </div>
        <div className="mx-auto max-w-2xl text-center mt-2">
          <h1 className="font-display text-2xl font-bold text-primary-foreground">My Quiz History</h1>
          <p className="text-sm text-primary-foreground/60 mt-1">{student?.full_name} · {student?.phone_number}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No quizzes attempted yet</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Start a Quiz</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((a, i) => {
              const pct = Math.round((a.score / a.total_marks) * 100);
              const mins = a.time_taken_seconds ? Math.floor(a.time_taken_seconds / 60) : null;
              const secs = a.time_taken_seconds ? a.time_taken_seconds % 60 : null;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-card-foreground">{(a.quizzes as any)?.title || "Quiz"}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(a.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{a.score}/{a.total_marks}</p>
                      <p className="text-xs text-muted-foreground">{pct}%</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span className="text-accent">✓ {a.correct_count}</span>
                    <span className="text-destructive">✗ {a.wrong_count}</span>
                    {mins !== null && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{mins}:{String(secs).padStart(2, "0")}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
