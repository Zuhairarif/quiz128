
-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  marks_per_question INTEGER NOT NULL DEFAULT 1,
  total_time_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_marks INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User answers table
CREATE TABLE public.user_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on all tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Public read for published quizzes
CREATE POLICY "Anyone can view published quizzes" ON public.quizzes
  FOR SELECT USING (status = 'published');

-- Admin can do everything (we'll use service role via edge functions for admin ops)
-- For quiz taking, users need to read questions of published quizzes
CREATE POLICY "Anyone can view questions of published quizzes" ON public.questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.status = 'published')
  );

-- Anyone can insert quiz attempts (no auth required for users)
CREATE POLICY "Anyone can create quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (true);

-- Anyone can read their own attempts (by attempt id)
CREATE POLICY "Anyone can read quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (true);

-- Anyone can insert user answers
CREATE POLICY "Anyone can create user answers" ON public.user_answers
  FOR INSERT WITH CHECK (true);

-- Anyone can read user answers
CREATE POLICY "Anyone can read user answers" ON public.user_answers
  FOR SELECT USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_user_answers_attempt_id ON public.user_answers(attempt_id);
