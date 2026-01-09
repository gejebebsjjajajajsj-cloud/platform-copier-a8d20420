-- Add color customization columns to site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS primary_button_color TEXT DEFAULT '#f97316',
ADD COLUMN IF NOT EXISTS secondary_button_color TEXT DEFAULT '#fdba74',
ADD COLUMN IF NOT EXISTS page_background_color TEXT DEFAULT '#fefefe',
ADD COLUMN IF NOT EXISTS footer_button_text TEXT DEFAULT 'Veja tudo por apenas',
ADD COLUMN IF NOT EXISTS footer_button_price TEXT DEFAULT 'R$ 9,90',
ADD COLUMN IF NOT EXISTS plan_30_days_price TEXT DEFAULT 'R$ 9,90',
ADD COLUMN IF NOT EXISTS plan_3_months_price TEXT DEFAULT 'R$ 19,90',
ADD COLUMN IF NOT EXISTS plan_1_year_price TEXT DEFAULT 'R$ 49,90',
ADD COLUMN IF NOT EXISTS plan_lifetime_price TEXT DEFAULT 'R$ 89,90',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS stats_photos INTEGER DEFAULT 354,
ADD COLUMN IF NOT EXISTS stats_videos INTEGER DEFAULT 148,
ADD COLUMN IF NOT EXISTS stats_likes TEXT DEFAULT '20.2K';

-- Create storage bucket for site images
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to site images
CREATE POLICY "Anyone can view site images"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-images');

-- Allow admins to upload site images
CREATE POLICY "Admins can upload site images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update site images
CREATE POLICY "Admins can update site images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete site images
CREATE POLICY "Admins can delete site images"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'::app_role));