-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for admin management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create site_settings table for admin panel
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banner_url TEXT,
    logo_url TEXT,
    profile_name TEXT NOT NULL DEFAULT 'Kamylinha Santos',
    profile_username TEXT NOT NULL DEFAULT 'eukamylinhasantos',
    profile_bio TEXT,
    button_text TEXT NOT NULL DEFAULT 'ASSINAR AGORA',
    subscription_price DECIMAL(10,2) NOT NULL DEFAULT 29.90,
    subscription_original_price DECIMAL(10,2) DEFAULT 49.90,
    discount_percent INTEGER DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read site settings (public page)
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can update site settings
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (
    profile_name,
    profile_username,
    profile_bio,
    button_text,
    subscription_price,
    subscription_original_price,
    discount_percent
) VALUES (
    'Kamylinha Santos',
    'eukamylinhasantos',
    'Oi, meus amores! 🔥💦 Sou a Kamylinha Santos, a musa da dancinha do tiktok, e hoje vou revelar um lado meu que vai te deixar sem fôlego… Imagine vídeos gozando com meus ficantes, trisal com amigas safadas e momentos íntimos onde me entrego de corpo e alma. 😏 Cada centímetro do meu corpo é pura tentação e minhas fotos peladas são um convite exclusivo para você explorar seus desejos mais secretos – tudo sem censura! Se você tem coragem de se perder nessa paixão sem limites, vem comigo... Estou te esperando para uma experiência única e irresistível.😈💋',
    'ASSINAR AGORA',
    29.90,
    49.90,
    40
);