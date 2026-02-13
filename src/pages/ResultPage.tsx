import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Home, Trophy, Medal } from "lucide-react";
import LatexRenderer from "@/components/LatexRenderer";

type Detail = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  selected_option: string | null;
  is_correct: boolean;
};

type LeaderboardEntry = {
  user_name: string;
  score: number;
  total_marks: number;
  rank: number;
};

type Result = {
  user_name: string;
  quiz_title: string;
  score: number;
  total_marks: number;
  correct_count: number;
  wrong_count: number;
  time_taken_seconds: number;
  details: Detail[];
  leaderboard?: LeaderboardEntry[];
  user_rank?: number;
};

function getOptionText(detail: Detail, key: string) {
  const map: Record<string, string> = {
    A: detail.option_a,
    B: detail.option_b,
    C: detail.option_c,
    D: detail.option_d,
  };
  return map[key] || "Not answered";
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as Result | undefined;

  if (!result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">No result data found.</p>
        <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const percentage = Math.round((result.score / result.total_marks) * 100);
  const minutes = Math.floor(result.time_taken_seconds / 60);
  const seconds = result.time_taken_seconds % 60;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Score header */}
      <div className="gradient-hero px-4 pb-10 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Trophy className="mx-auto mb-3 h-10 w-10 text-primary-foreground/80" />
          <h1 className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
            Quiz Complete!
          </h1>
          <p className="mt-1 text-primary-foreground/70">{result.quiz_title}</p>
          <p className="mt-1 text-sm text-primary-foreground/60">by {result.user_name}</p>

          <div className="mt-4 inline-flex items-baseline gap-1">
            <span className="font-display text-5xl font-bold text-primary-foreground">{result.score}</span>
            <span className="text-xl text-primary-foreground/60">/{result.total_marks}</span>
          </div>
          <p className="mt-1 text-lg text-primary-foreground/70">{percentage}%</p>
          {result.user_rank && (
            <p className="mt-2 text-sm font-medium text-accent">
              🏆 Your Rank: #{result.user_rank}
            </p>
          )}
        </motion.div>
      </div>

      {/* Stats */}
      <div className="mx-auto -mt-5 max-w-2xl px-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-accent">{result.correct_count}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-destructive">{result.wrong_count}</p>
            <p className="text-xs text-muted-foreground">Wrong</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-card-foreground">{minutes}:{String(seconds).padStart(2, "0")}</p>
            <p className="text-xs text-muted-foreground">Time</p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {result.leaderboard && result.leaderboard.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl px-4">
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <Medal className="h-5 w-5 text-accent" /> Leaderboard
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {result.leaderboard.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-3 ${
                  i !== result.leaderboard!.length - 1 ? "border-b border-border" : ""
                } ${entry.user_name === result.user_name ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    entry.rank === 1 ? "bg-accent text-accent-foreground" :
                    entry.rank === 2 ? "bg-muted text-foreground" :
                    entry.rank === 3 ? "bg-accent/30 text-accent-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {entry.rank}
                  </span>
                  <span className={`text-sm font-medium ${entry.user_name === result.user_name ? "text-primary font-semibold" : "text-card-foreground"}`}>
                    {entry.user_name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-card-foreground">
                  {entry.score}/{entry.total_marks}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed results */}
      <div className="mx-auto mt-8 max-w-2xl px-4">
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Question Analysis</h2>
        <div className="space-y-4">
          {result.details.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-xl border-2 p-5 ${
                d.is_correct ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-foreground">
                  <span className="text-muted-foreground">Q{i + 1}. </span>
                  <LatexRenderer text={d.question_text} />
                </p>
                {d.is_correct ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                )}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Your answer: </span>
                  <span className={d.is_correct ? "font-medium text-accent" : "font-medium text-destructive"}>
                    {d.selected_option ? <><span>{d.selected_option}) </span><LatexRenderer text={getOptionText(d, d.selected_option)} /></> : "Not answered"}
                  </span>
                </p>
                {!d.is_correct && (
                  <p>
                    <span className="text-muted-foreground">Correct answer: </span>
                    <span className="font-medium text-accent">
                      {d.correct_option}) <LatexRenderer text={getOptionText(d, d.correct_option)} />
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-2xl px-4 text-center">
        <Button size="lg" onClick={() => navigate("/")}>
          <Home className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>
    </div>
  );
}
