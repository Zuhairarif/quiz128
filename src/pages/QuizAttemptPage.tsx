import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/api";
import Timer, { useElapsedTime } from "@/components/Timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Send, User } from "lucide-react";
import { toast } from "sonner";

type Question = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  question_order: number;
};

type Quiz = {
  id: string;
  title: string;
  total_time_minutes: number;
  marks_per_question: number;
};

export default function QuizAttemptPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [userName, setUserName] = useState("");
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const getElapsed = useElapsedTime();

  useEffect(() => {
    if (!quizId) return;
    Promise.all([
      supabase.from("quizzes").select("*").eq("id", quizId).eq("status", "published").single(),
      supabase.from("questions").select("*").eq("quiz_id", quizId).order("question_order"),
    ]).then(([quizRes, qRes]) => {
      if (quizRes.data) setQuiz(quizRes.data as any);
      if (qRes.data) setQuestions(qRes.data as any);
      setLoading(false);
    });
  }, [quizId]);

  const handleSubmit = useCallback(async () => {
    if (submitted || submitting || !quiz) return;
    setSubmitting(true);
    try {
      const result = await adminApi.submitQuiz(quiz.id, userName, answers, getElapsed());
      navigate(`/result`, { state: { result }, replace: true });
    } catch (e: any) {
      toast.error(e.message || "Failed to submit quiz");
      setSubmitting(false);
    }
  }, [quiz, userName, answers, getElapsed, navigate, submitted, submitting]);

  const handleTimeExpire = useCallback(() => {
    if (!submitted) {
      toast.info("Time's up! Auto-submitting your quiz...");
      handleSubmit();
    }
  }, [handleSubmit, submitted]);

  // Prevent page refresh during quiz
  useEffect(() => {
    if (!started || submitted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started, submitted]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p className="text-lg text-muted-foreground">Quiz not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  // Name entry screen
  if (!started) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg"
        >
          <h2 className="font-display text-2xl font-bold text-card-foreground">{quiz.title}</h2>
          <p className="mt-2 text-muted-foreground">
            {questions.length} questions · {questions.length * quiz.marks_per_question} marks · {quiz.total_time_minutes} min
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && userName.trim()) setStarted(true);
                  }}
                />
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!userName.trim()}
              onClick={() => setStarted(true)}
            >
              Start Quiz
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const options = [
    { key: "A", text: currentQ.option_a },
    { key: "B", text: currentQ.option_b },
    { key: "C", text: currentQ.option_c },
    { key: "D", text: currentQ.option_d },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="text-sm font-medium text-muted-foreground">
            Q {currentIndex + 1}/{questions.length}
          </div>
          <Timer
            totalSeconds={quiz.total_time_minutes * 60}
            onExpire={handleTimeExpire}
          />
        </div>
        {/* Progress bar */}
        <div className="mx-auto mt-2 max-w-3xl">
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <main className="mx-auto max-w-3xl p-4 py-8">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
            {currentQ.question_text}
          </h2>

          <div className="mt-6 space-y-3">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.key }))}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  answers[currentQ.id] === opt.key
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    answers[currentQ.id] === opt.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.key}
                </span>
                <span className="pt-1 text-card-foreground">{opt.text}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex((i) => i + 1)}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              <Send className="mr-1 h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>

        {/* Question dots */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                i === currentIndex
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : answers[q.id]
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
