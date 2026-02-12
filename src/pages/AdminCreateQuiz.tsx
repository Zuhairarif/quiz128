import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Upload, Loader2, Save, ArrowLeft, AlertCircle } from "lucide-react";
import LatexRenderer from "@/components/LatexRenderer";

type ExtractedQuestion = {
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

export default function AdminCreateQuiz() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [marksPerQ, setMarksPerQ] = useState(1);
  const [totalTime, setTotalTime] = useState(30);
  const [classLevel, setClassLevel] = useState("");
  const [testType, setTestType] = useState("");
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const result = await adminApi.extractQuiz(base64, file.name);
      setTitle(result.title || file.name.replace(/\.(pdf|txt)$/i, ""));
      setQuestions(result.questions || []);
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
    if (!title.trim()) { toast.error("Please enter a quiz title"); return; }
    if (!classLevel) { toast.error("Please select a class"); return; }
    if (!testType) { toast.error("Please select a test type"); return; }
    if (testType === "topic_wise" && !subject) { toast.error("Please select a subject"); return; }
    if (questions.length === 0) { toast.error("No questions to save"); return; }
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
        class_level: classLevel,
        test_type: testType,
        subject: testType === "topic_wise" ? subject : null,
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
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Quiz Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter quiz title" />
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
                    {/* Preview rendered LaTeX */}
                    <span className="ml-auto text-xs text-muted-foreground">Preview:</span>
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
