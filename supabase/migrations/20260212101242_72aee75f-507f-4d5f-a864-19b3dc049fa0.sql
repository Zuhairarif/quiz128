
-- Add class_level, test_type, and subject columns to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN class_level text DEFAULT NULL,
ADD COLUMN test_type text DEFAULT NULL,
ADD COLUMN subject text DEFAULT NULL;

-- Create indexes for filtering
CREATE INDEX idx_quizzes_class_level ON public.quizzes(class_level);
CREATE INDEX idx_quizzes_test_type ON public.quizzes(test_type);
CREATE INDEX idx_quizzes_subject ON public.quizzes(subject);
