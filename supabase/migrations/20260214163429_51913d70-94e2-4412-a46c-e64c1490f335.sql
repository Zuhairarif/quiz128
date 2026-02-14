
-- Create student_profiles table
CREATE TABLE public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  full_name TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read/insert/update student profiles (no auth system)
CREATE POLICY "Anyone can read student profiles"
  ON public.student_profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can create student profiles"
  ON public.student_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update student profiles"
  ON public.student_profiles FOR UPDATE USING (true);

-- Add student_profile_id to quiz_attempts
ALTER TABLE public.quiz_attempts
  ADD COLUMN student_profile_id UUID REFERENCES public.student_profiles(id);
