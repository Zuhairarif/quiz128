import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import QuizCard from "@/components/QuizCard";
import { Search, BookOpen, GraduationCap, FlaskConical, Calculator, Languages, BookText, Landmark, ChevronLeft, FileText, ClipboardList, ScrollText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import bismillahImg from "@/assets/bismillah.webp";
import ssnLogo from "@/assets/ssn-logo.png";

const CLASSES = [
  { label: "Class 6", value: "6", icon: BookOpen },
  { label: "Class 9", value: "9", icon: GraduationCap },
  { label: "Class 11", value: "11", icon: GraduationCap },
];

const TEST_TYPES = [
  { label: "Topic Wise Test", value: "topic_wise", icon: FlaskConical, desc: "Subject & topic based tests" },
  { label: "Full Test", value: "full_test", icon: ClipboardList, desc: "Full-length practice tests" },
  { label: "PYQs", value: "pyqs", icon: ScrollText, desc: "Previous Year Questions" },
];

const SUBJECTS = [
  { label: "Science", value: "science", icon: FlaskConical },
  { label: "Maths", value: "maths", icon: Calculator },
  { label: "English", value: "english", icon: Languages },
  { label: "Hindi", value: "hindi", icon: BookText },
  { label: "Indo-Islamic", value: "indo_islamic", icon: Landmark },
];

type Quiz = {
  id: string;
  title: string;
  marks_per_question: number;
  total_time_minutes: number;
  class_level: string | null;
  test_type: string | null;
  subject: string | null;
  attempts_closed: boolean;
  questions: { count: number }[];
};

type NavState = {
  classLevel?: string;
  testType?: string;
  subject?: string;
};

export default function HomePage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nav, setNav] = useState<NavState>({});
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("quizzes")
      .select("id, title, marks_per_question, total_time_minutes, class_level, test_type, subject, attempts_closed, questions(count)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setQuizzes((data as any) || []);
        setLoading(false);
      });
  }, []);

  const goBack = () => {
    if (nav.subject) setNav({ classLevel: nav.classLevel, testType: nav.testType });
    else if (nav.testType) setNav({ classLevel: nav.classLevel });
    else if (nav.classLevel) setNav({});
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (q.attempts_closed) return false;
    if (nav.classLevel && q.class_level !== nav.classLevel) return false;
    if (nav.testType && q.test_type !== nav.testType) return false;
    if (nav.subject && q.subject !== nav.subject) return false;
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const showQuizList = nav.classLevel && nav.testType && (nav.testType !== "topic_wise" || nav.subject);

  const breadcrumb = [
    nav.classLevel && `Class ${nav.classLevel}`,
    nav.testType && TEST_TYPES.find((t) => t.value === nav.testType)?.label,
    nav.subject && SUBJECTS.find((s) => s.value === nav.subject)?.label,
  ].filter(Boolean).join(" › ");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero px-4 pb-6 pt-4 text-center relative">
     <img
  src={ssnLogo}
  alt="SSN Logo"
  className="
    absolute top-3 left-3
    h-14 w-14 sm:h-16 sm:w-16
    rounded-full
    bg-white/90
    p-2
    shadow-md
    object-contain
  "
/>


        <Link
          to="/admin/login"
          className="absolute top-3 right-3 text-primary-foreground/30 hover:text-primary-foreground/60 text-xs transition-colors"
        >
          Admin
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
          <img
            src={bismillahImg}
            alt="Bismillah"
            className="mx-auto mb-2 h-10 object-contain opacity-90"
          />
          <h1 className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl tracking-tight">
            Student Support Network
          </h1>
          <p className="text-sm font-medium text-accent">SSN</p>
          <p className="mt-1 text-xs text-primary-foreground/60 italic max-w-sm mx-auto">
            "An initiative for the education and awareness of educationally backward people"
          </p>
        </motion.div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8">
        {/* Back button & breadcrumb */}
        {nav.classLevel && (
          <div className="mb-6 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goBack} className="shrink-0">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <span className="text-sm text-muted-foreground">{breadcrumb}</span>
          </div>
        )}

        {/* STEP 1: Class selection */}
        {!nav.classLevel && (
          <div>
            <h2 className="mb-6 font-display text-xl font-semibold text-foreground text-center">Choose Your Class</h2>
            <div className="grid gap-5 sm:grid-cols-3 max-w-2xl mx-auto">
              {CLASSES.map((cls, i) => (
                <motion.div
                  key={cls.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <button
                    onClick={() => setNav({ classLevel: cls.value })}
                    className="w-full rounded-2xl border-2 border-border bg-card p-8 text-center transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 group"
                  >
                    <cls.icon className="mx-auto mb-3 h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-display text-2xl font-bold text-card-foreground">{cls.label}</h3>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Test type selection */}
        {nav.classLevel && !nav.testType && (
          <div>
            <h2 className="mb-6 font-display text-xl font-semibold text-foreground text-center">
              Class {nav.classLevel} — Select Test Type
            </h2>
            <div className="grid gap-5 sm:grid-cols-3 max-w-2xl mx-auto">
              {TEST_TYPES.map((tt, i) => (
                <motion.div
                  key={tt.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <button
                    onClick={() => setNav({ ...nav, testType: tt.value })}
                    className="w-full rounded-2xl border-2 border-border bg-card p-8 text-center transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 group"
                  >
                    <tt.icon className="mx-auto mb-3 h-10 w-10 text-accent group-hover:scale-110 transition-transform" />
                    <h3 className="font-display text-xl font-bold text-card-foreground">{tt.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tt.desc}</p>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Subject selection (only for topic_wise) */}
        {nav.classLevel && nav.testType === "topic_wise" && !nav.subject && (
          <div>
            <h2 className="mb-6 font-display text-xl font-semibold text-foreground text-center">
              Select Subject
            </h2>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 max-w-3xl mx-auto">
              {SUBJECTS.map((sub, i) => (
                <motion.div
                  key={sub.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <button
                    onClick={() => setNav({ ...nav, subject: sub.value })}
                    className="w-full rounded-2xl border-2 border-border bg-card p-6 text-center transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 group"
                  >
                    <sub.icon className="mx-auto mb-2 h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-display text-lg font-semibold text-card-foreground">{sub.label}</h3>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Quiz list */}
        {showQuizList && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tests..."
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
            ) : filteredQuizzes.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">
                  {search ? "No tests match your search" : "No tests available yet"}
                </p>
              </motion.div>
            ) : (
              <AnimatePresence>
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredQuizzes.map((quiz, i) => (
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
          </div>
        )}
      </main>
    </div>
  );
}
