-- Add description column to campaigns for ad details visible to viewers
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS ad_title text,
ADD COLUMN IF NOT EXISTS ad_description text;