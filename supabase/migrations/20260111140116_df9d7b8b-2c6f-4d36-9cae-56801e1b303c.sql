-- Add video_segments column to store multiple frames/images for video ads
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS video_segments JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.advertisements.video_segments IS 'Array of video segments with image URLs and timing for video ad playback';