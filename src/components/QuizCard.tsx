import { motion } from "framer-motion";
import { Clock, FileText, Award } from "lucide-react";

type QuizCardProps = {
  id: string;
  title: string;
  questionCount: number;
  totalMarks: number;
  totalTimeMinutes: number;
  onClick: () => void;
};

export default function QuizCard({ title, questionCount, totalMarks, totalTimeMinutes, onClick }: QuizCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="mb-4">
        <h3 className="font-display text-xl font-semibold text-card-foreground leading-tight">
          {title}
        </h3>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <FileText className="h-3.5 w-3.5" />
          {questionCount} Q's
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
          <Award className="h-3.5 w-3.5" />
          {totalMarks} marks
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-quiz-amber/10 px-3 py-1 text-sm font-medium text-quiz-amber">
          <Clock className="h-3.5 w-3.5" />
          {totalTimeMinutes} min
        </div>
      </div>
    </motion.div>
  );
}
