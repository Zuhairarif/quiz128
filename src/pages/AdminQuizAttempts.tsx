import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Eye, Users, Clock, CheckCircle2, XCircle, Medal, MapPin, Phone } from "lucide-react";

type Attempt = {
  id: string;
  user_name: string;
  user_address: string | null;
  user_phone: string | null;
  score: number;
  total_marks: number;
  correct_count: number;
  wrong_count: number;
  time_taken_seconds: number | null;
  submitted_at: string;
  rank: number;
};

type AnswerDetail = {
  selected_option: string | null;
  is_correct: boolean;
  questions: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
  };
};

export default function AdminQuizAttempts() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const [details, setDetails] = useState<{ attempt: Attempt; answers: AnswerDetail[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    adminApi.quizAction("attempts", { quiz_id: quizId }).then((res) => {
      setAttempts(res.attempts || []);
      setLoading(false);
    }).catch((e) => {
      toast.error(e.message);
      setLoading(false);
    });
  }, [quizId]);

  const viewDetail = async (attemptId: string) => {
    setSelectedAttempt(attemptId);
    setDetailLoading(true);
    try {
      const res = await adminApi.quizAction("attempt_detail", { attempt_id: attemptId });
      setDetails(res);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  function getOptionText(q: AnswerDetail["questions"], key: string) {
    const map: Record<string, string> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
    return map[key] || "—";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-xl font-bold text-card-foreground">Quiz Attempts</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 py-8">
        {/* Attempt detail */}
        {selectedAttempt && details && !detailLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-card-foreground">
                {details.attempt.user_name}'s Attempt
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedAttempt(null); setDetails(null); }}>
                Close
              </Button>
            </div>

            {(details.attempt.user_address || details.attempt.user_phone) && (
              <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {details.attempt.user_address && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {details.attempt.user_address}</span>
                )}
                {details.attempt.user_phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {details.attempt.user_phone}</span>
                )}
              </div>
            )}

            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xl font-bold text-foreground">{details.attempt.score}/{details.attempt.total_marks}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xl font-bold text-accent">{details.attempt.correct_count}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xl font-bold text-destructive">{details.attempt.wrong_count}</p>
                <p className="text-xs text-muted-foreground">Wrong</p>
              </div>
            </div>

            <div className="space-y-3">
              {details.answers.map((a, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 ${
                    a.is_correct ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Q{i + 1}. {a.questions.question_text}
                    </p>
                    {a.is_correct ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    <p>Selected: <span className={a.is_correct ? "text-accent" : "text-destructive"}>
                      {a.selected_option ? `${a.selected_option}) ${getOptionText(a.questions, a.selected_option)}` : "Not answered"}
                    </span></p>
                    {!a.is_correct && (
                      <p>Correct: <span className="text-accent">
                        {a.questions.correct_option}) {getOptionText(a.questions, a.questions.correct_option)}
                      </span></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Attempts list with ranks */}
        {attempts.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No attempts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    a.rank === 1 ? "bg-accent text-accent-foreground" :
                    a.rank === 2 ? "bg-muted text-foreground" :
                    a.rank === 3 ? "bg-accent/30 text-accent-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {a.rank}
                  </span>
                  <div>
                    <p className="font-medium text-card-foreground">{a.user_name}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>{a.score}/{a.total_marks} marks</span>
                      <span className="text-accent">{a.correct_count} correct</span>
                      <span className="text-destructive">{a.wrong_count} wrong</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(a.time_taken_seconds)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => viewDetail(a.id)}>
                  <Eye className="mr-1 h-3.5 w-3.5" /> Details
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
