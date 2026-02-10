import { useState, useEffect, useCallback } from "react";

type TimerProps = {
  totalSeconds: number;
  onExpire: () => void;
  paused?: boolean;
};

export default function Timer({ totalSeconds, onExpire, paused }: TimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, paused, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const percentage = (remaining / totalSeconds) * 100;

  const isUrgent = remaining < 60;
  const isWarning = remaining < totalSeconds * 0.2;

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-2 font-display text-lg font-semibold tabular-nums ${
      isUrgent
        ? "animate-pulse-soft border-destructive/50 bg-destructive/10 text-destructive"
        : isWarning
        ? "border-quiz-amber/50 bg-quiz-amber/10 text-quiz-amber"
        : "border-border bg-card text-card-foreground"
    }`}>
      <svg className="h-6 w-6 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.2" />
        <circle
          cx="50" cy="50" r="45" fill="none"
          stroke="currentColor" strokeWidth="6"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * percentage) / 100}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}

export function useElapsedTime() {
  const [startTime] = useState(Date.now());
  
  const getElapsed = useCallback(() => {
    return Math.floor((Date.now() - startTime) / 1000);
  }, [startTime]);

  return getElapsed;
}
