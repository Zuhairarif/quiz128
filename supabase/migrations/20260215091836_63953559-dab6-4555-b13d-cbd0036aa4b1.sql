
-- Create notifications table for admin broadcasts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Everyone can read active notifications
CREATE POLICY "Anyone can read active notifications"
ON public.notifications
FOR SELECT
USING (is_active = true);

-- Create notification_reads table for per-user read tracking
CREATE TABLE public.notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notification_id, student_profile_id)
);

-- Enable RLS
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Anyone can read notification_reads
CREATE POLICY "Anyone can read notification reads"
ON public.notification_reads
FOR SELECT
USING (true);

-- Anyone can insert notification reads
CREATE POLICY "Anyone can insert notification reads"
ON public.notification_reads
FOR INSERT
WITH CHECK (true);
