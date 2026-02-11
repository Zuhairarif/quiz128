import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import QuizCard from "@/components/QuizCard";
import { Brain, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Quiz = {
  id: string;
  title: string;
  marks_per_question: number;
  total_time_minutes: number;
  questions: { count: number }[];
};

export default function HomePage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("quizzes")
      .select("id, title, marks_per_question, total_time_minutes, questions(count)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setQuizzes((data as any) || []);
        setLoading(false);
      });
  }, []);

  const filtered = quizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="gradient-hero px-4 pb-16 pt-12 text-center relative">
        <Link
          to="/admin/login"
          className="absolute top-4 right-4 text-primary-foreground/50 hover:text-primary-foreground/80 text-xs transition-colors"
        >
          Admin
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/20 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm">
            <Brain className="h-4 w-4" />
            Test Your Knowledge
          </div>
          <h1 className="font-display text-4xl font-bold text-primary-foreground sm:text-5xl">
            QuizHub
          </h1>
          <p className="mt-3 text-lg text-primary-foreground/80">
            Pick a quiz and challenge yourself. No signup needed.
          </p>
        </motion.div>
      </header>

      {/* Search & Quizzes */}
      <main className="mx-auto -mt-8 max-w-4xl px-4 pb-16">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-xl border-border bg-card pl-10 shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              {search ? "No quizzes match your search" : "No quizzes available yet"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((quiz, i) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <QuizCard
                    id={quiz.id}
                    title={quiz.title}
                    questionCount={quiz.questions?.[0]?.count || 0}
                    totalMarks={(quiz.questions?.[0]?.count || 0) * quiz.marks_per_question}
                    totalTimeMinutes={quiz.total_time_minutes}
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
