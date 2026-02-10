import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Upload, Loader2, Save, ArrowLeft, AlertCircle } from "lucide-react";

type ExtractedQuestion = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string | null;
};

export default function AdminCreateQuiz() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [marksPerQ, setMarksPerQ] = useState(1);
  const [totalTime, setTotalTime] = useState(30);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasAnswers, setHasAnswers] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read PDF as text (using FileReader for text-based PDFs)
    setExtracting(true);
    try {
      const text = await file.text();
      if (!text.trim()) {
        toast.error("Could not extract text. Try a text-based PDF.");
        setExtracting(false);
        return;
      }

      const result = await adminApi.extractQuiz(text);
      setTitle(result.title || file.name.replace(".pdf", ""));
      setQuestions(result.questions || []);
      setHasAnswers(result.has_answers || false);
      toast.success(`Extracted ${result.questions?.length || 0} questions`);

      if (!result.has_answers) {
        toast.warning("No correct answers detected. Please set them manually before publishing.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to extract quiz");
    } finally {
      setExtracting(false);
    }
  };

  const updateQuestion = (index: number, field: keyof ExtractedQuestion, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const allAnswersSet = questions.every((q) => q.correct_option);

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }
    if (questions.length === 0) {
      toast.error("No questions to save");
      return;
    }
    if (status === "published" && !allAnswersSet) {
      toast.error("Set correct answers for all questions before publishing");
      return;
    }

    setSaving(true);
    try {
      await adminApi.quizAction("create", {
        title,
        marks_per_question: marksPerQ,
        total_time_minutes: totalTime,
        questions,
        status,
      });
      toast.success(status === "published" ? "Quiz published!" : "Quiz saved as draft");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-xl font-bold text-card-foreground">Create Quiz</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 py-8">
        {/* Upload Section */}
        <div className="mb-8 rounded-xl border-2 border-dashed border-border p-8 text-center">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-3 text-muted-foreground">Upload a PDF or text file with MCQ questions</p>
          <Button onClick={() => fileRef.current?.click()} disabled={extracting}>
            {extracting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting with AI...</> : "Choose File"}
          </Button>
        </div>

        {/* Quiz Settings */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Quiz Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter quiz title" />
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

        {/* Questions */}
        {questions.length > 0 && (
          <>
            {!allAnswersSet && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-quiz-amber/30 bg-quiz-amber/10 p-3 text-sm text-quiz-amber">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Some questions are missing correct answers. Set them before publishing.
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
                    <span className="text-sm font-medium text-muted-foreground">Question</span>
                  </div>

                  <Textarea
                    value={q.question_text}
                    onChange={(e) => updateQuestion(i, "question_text", e.target.value)}
                    className="mb-3"
                    rows={2}
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    {(["A", "B", "C", "D"] as const).map((opt) => {
                      const field = `option_${opt.toLowerCase()}` as keyof ExtractedQuestion;
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

            {/* Save buttons */}
            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
                <Save className="mr-1 h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={() => handleSave("published")} disabled={saving || !allAnswersSet}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Publish Quiz
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
