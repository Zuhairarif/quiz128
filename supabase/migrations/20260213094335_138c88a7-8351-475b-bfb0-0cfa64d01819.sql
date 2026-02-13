
-- Add user contact fields to quiz_attempts
ALTER TABLE public.quiz_attempts
ADD COLUMN user_address text DEFAULT NULL,
ADD COLUMN user_phone text DEFAULT NULL;

-- Add attempts_closed flag to quizzes
ALTER TABLE public.quizzes
ADD COLUMN attempts_closed boolean NOT NULL DEFAULT false;
