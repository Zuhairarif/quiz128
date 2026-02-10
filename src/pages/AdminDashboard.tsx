import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Plus, FileText, Users, LogOut, Trash2, Eye, Pencil, Globe, GlobeLock,
} from "lucide-react";
import { toast } from "sonner";

type Quiz = {
  id: string;
  title: string;
  status: string;
  question_count: number;
  attempt_count: number;
  created_at: string;
};

type Stats = { quiz_count: number; attempt_count: number };

export default function AdminDashboard() {
  const { logout } = useAdmin();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<Stats>({ quiz_count: 0, attempt_count: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [quizRes, statsRes] = await Promise.all([
        adminApi.quizAction("list"),
        adminApi.quizAction("stats"),
      ]);
      setQuizzes(quizRes.quizzes || []);
      setStats(statsRes);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quiz and all its data?")) return;
    try {
      await adminApi.quizAction("delete", { id });
      toast.success("Quiz deleted");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    try {
      await adminApi.quizAction("update", {
        id: quiz.id,
        status: quiz.status === "published" ? "draft" : "published",
      });
      toast.success(quiz.status === "published" ? "Quiz unpublished" : "Quiz published");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl font-bold text-card-foreground">QuizHub Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Eye className="mr-1 h-4 w-4" /> View Site
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/admin/login"); }}>
              <LogOut className="mr-1 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Total Quizzes</p>
            <p className="mt-1 font-display text-3xl font-bold text-card-foreground">{stats.quiz_count}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Total Attempts</p>
            <p className="mt-1 font-display text-3xl font-bold text-card-foreground">{stats.attempt_count}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Quizzes</h2>
          <Button onClick={() => navigate("/admin/create")}>
            <Plus className="mr-1 h-4 w-4" /> Create Quiz
          </Button>
        </div>

        {/* Quiz list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No quizzes yet. Create your first quiz!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-card-foreground truncate">{quiz.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      quiz.status === "published"
                        ? "bg-accent/10 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {quiz.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {quiz.question_count} questions · {quiz.attempt_count} attempts
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/quiz/${quiz.id}/attempts`)}>
                    <Users className="mr-1 h-3.5 w-3.5" /> Attempts
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/edit/${quiz.id}`)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleTogglePublish(quiz)}>
                    {quiz.status === "published" ? (
                      <><GlobeLock className="mr-1 h-3.5 w-3.5" /> Unpublish</>
                    ) : (
                      <><Globe className="mr-1 h-3.5 w-3.5" /> Publish</>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(quiz.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
