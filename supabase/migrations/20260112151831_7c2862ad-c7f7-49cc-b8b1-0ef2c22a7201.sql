-- Add audio settings columns to advertisements
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS audio_type TEXT DEFAULT 'ai',
ADD COLUMN IF NOT EXISTS audio_prompt TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS shop_video_url TEXT;