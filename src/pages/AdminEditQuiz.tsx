import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Save, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

type Question = {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string | null;
};

export default function AdminEditQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [marksPerQ, setMarksPerQ] = useState(1);
  const [totalTime, setTotalTime] = useState(30);
  const [status, setStatus] = useState("draft");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    adminApi.quizAction("get", { id: quizId }).then((res) => {
      const quiz = res.quiz;
      setTitle(quiz.title);
      setMarksPerQ(quiz.marks_per_question);
      setTotalTime(quiz.total_time_minutes);
      setStatus(quiz.status);
      setQuestions(
        (quiz.questions || [])
          .sort((a: any, b: any) => a.question_order - b.question_order)
          .map((q: any) => ({
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option,
          }))
      );
      setLoading(false);
    }).catch((e) => {
      toast.error(e.message);
      setLoading(false);
    });
  }, [quizId]);

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const allAnswersSet = questions.every((q) => q.correct_option);

  const handleSave = async (newStatus?: string) => {
    const saveStatus = newStatus || status;
    if (saveStatus === "published" && !allAnswersSet) {
      toast.error("Set correct answers for all questions before publishing");
      return;
    }

    setSaving(true);
    try {
      await adminApi.quizAction("update", {
        id: quizId,
        title,
        marks_per_question: marksPerQ,
        total_time_minutes: totalTime,
        status: saveStatus,
        questions,
      });
      toast.success("Quiz saved!");
      navigate("/admin");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="font-display text-xl font-bold text-card-foreground">Edit Quiz</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Quiz Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Marks per Question</label>
            <Input type="number" min={1} value={marksPerQ} onChange={(e) => setMarksPerQ(Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Total Time (minutes)</label>
            <Input type="number" min={1} value={totalTime} onChange={(e) => setTotalTime(Number(e.target.value))} />
          </div>
        </div>

        {!allAnswersSet && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-quiz-amber/30 bg-quiz-amber/10 p-3 text-sm text-quiz-amber">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Some questions are missing correct answers.
          </div>
        )}

        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Questions ({questions.length})
        </h2>

        <div className="space-y-6">
          {questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </div>

              <Textarea
                value={q.question_text}
                onChange={(e) => updateQuestion(i, "question_text", e.target.value)}
                className="mb-3"
                rows={2}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                {(["A", "B", "C", "D"] as const).map((opt) => {
                  const field = `option_${opt.toLowerCase()}` as keyof Question;
                  return (
                    <div key={opt} className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuestion(i, "correct_option", opt)}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                          q.correct_option === opt
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {opt}
                      </button>
                      <Input
                        value={q[field] as string}
                        onChange={(e) => updateQuestion(i, field, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Save className="mr-1 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={() => handleSave("published")} disabled={saving || !allAnswersSet}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publish
          </Button>
        </div>
      </main>
    </div>
  );
}
