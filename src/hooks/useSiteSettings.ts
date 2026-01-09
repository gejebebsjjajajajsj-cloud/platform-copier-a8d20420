import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  id: string;
  banner_url: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  profile_name: string;
  profile_username: string;
  profile_bio: string | null;
  button_text: string;
  subscription_price: number;
  subscription_original_price: number | null;
  discount_percent: number | null;
  primary_button_color: string | null;
  secondary_button_color: string | null;
  page_background_color: string | null;
  footer_button_text: string | null;
  footer_button_price: string | null;
  plan_30_days_price: string | null;
  plan_3_months_price: string | null;
  plan_1_year_price: string | null;
  plan_lifetime_price: string | null;
  stats_photos: number | null;
  stats_videos: number | null;
  stats_likes: string | null;
  created_at: string;
  updated_at: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as SiteSettings | null;
    },
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<SiteSettings>) => {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('site_settings')
          .update(settings)
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('site_settings')
          .insert(settings)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
};

export const uploadSiteImage = async (file: File, path: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${path}-${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('site-images')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('site-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
};
