import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Save, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import LatexRenderer from "@/components/LatexRenderer";

type Question = {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string | null;
};

const CLASS_OPTIONS = [
  { label: "Class 6", value: "6" },
  { label: "Class 9", value: "9" },
  { label: "Class 11", value: "11" },
];

const TEST_TYPES = [
  { label: "Topic Wise Test", value: "topic_wise" },
  { label: "Full Test", value: "full_test" },
  { label: "PYQs", value: "pyqs" },
];

const SUBJECTS = [
  { label: "Science", value: "science" },
  { label: "Maths", value: "maths" },
  { label: "English", value: "english" },
  { label: "Hindi", value: "hindi" },
  { label: "Indo-Islamic", value: "indo_islamic" },
];

export default function AdminEditQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [marksPerQ, setMarksPerQ] = useState(1);
  const [totalTime, setTotalTime] = useState(30);
  const [status, setStatus] = useState("draft");
  const [classLevel, setClassLevel] = useState("");
  const [testType, setTestType] = useState("");
  const [subject, setSubject] = useState("");
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
      setClassLevel(quiz.class_level || "");
      setTestType(quiz.test_type || "");
      setSubject(quiz.subject || "");
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
        class_level: classLevel || null,
        test_type: testType || null,
        subject: testType === "topic_wise" ? subject || null : null,
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
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Quiz Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Class</label>
            <Select value={classLevel} onValueChange={setClassLevel}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Test Type</label>
            <Select value={testType} onValueChange={(v) => { setTestType(v); if (v !== "topic_wise") setSubject(""); }}>
              <SelectTrigger><SelectValue placeholder="Select Test Type" /></SelectTrigger>
              <SelectContent>
                {TEST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {testType === "topic_wise" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

              <div className="mb-2 rounded-lg bg-muted/50 p-3 text-sm">
                <LatexRenderer text={q.question_text} />
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
                      <div className="flex-1 space-y-1">
                        <Input
                          value={q[field] as string}
                          onChange={(e) => updateQuestion(i, field, e.target.value)}
                        />
                        <div className="text-xs px-1">
                          <LatexRenderer text={q[field] as string} />
                        </div>
                      </div>
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
