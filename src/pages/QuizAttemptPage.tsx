import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/api";
import Timer, { useElapsedTime } from "@/components/Timer";
import { Button } from "@/components/ui/button";

import { ChevronLeft, ChevronRight, Send, Phone } from "lucide-react";
import { toast } from "sonner";
import LatexRenderer from "@/components/LatexRenderer";
import { useStudent } from "@/hooks/useStudent";
import PhoneLoginDialog from "@/components/PhoneLoginDialog";
import { cleanQuestionText } from "@/lib/cleanQuestionText";

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
  attempts_closed: boolean;
};

export default function QuizAttemptPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { student, isLoggedIn } = useStudent();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPhoneLogin, setShowPhoneLogin] = useState(false);

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
    if (submitted || submitting || !quiz || !student) return;
    setSubmitting(true);
    try {
      const displayName = student.full_name || student.phone_number;
      const result = await adminApi.submitQuiz(quiz.id, displayName, answers, getElapsed(), student.address || undefined, student.phone_number, student.id);
      navigate(`/result`, { state: { result }, replace: true });
    } catch (e: any) {
      toast.error(e.message || "Failed to submit quiz");
      setSubmitting(false);
    }
  }, [quiz, answers, getElapsed, navigate, submitted, submitting, student]);

  const handleTimeExpire = useCallback(() => {
    if (!submitted) {
      toast.info("Time's up! Auto-submitting your quiz...");
      handleSubmit();
    }
  }, [handleSubmit, submitted]);

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

  if (quiz.attempts_closed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p className="text-lg font-medium text-destructive">Attempts are closed for this quiz.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  // Must be logged in to start quiz
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
            {isLoggedIn ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Logged in as <span className="font-medium text-foreground">{student?.full_name || student?.phone_number}</span>
                </p>
                <Button className="w-full" size="lg" onClick={() => setStarted(true)}>
                  Start Quiz
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Please register or login to start this quiz.
                </p>
                <Button className="w-full" size="lg" onClick={() => setShowPhoneLogin(true)}>
                  <Phone className="mr-2 h-4 w-4" /> Register / Login to Start
                </Button>
              </>
            )}
          </div>
        </motion.div>
        <PhoneLoginDialog open={showPhoneLogin} onOpenChange={setShowPhoneLogin} />
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
            <LatexRenderer text={cleanQuestionText(currentQ.question_text)} />
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
                <span className="pt-1 text-card-foreground"><LatexRenderer text={cleanQuestionText(opt.text)} /></span>
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
