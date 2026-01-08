-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursion)
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

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create businesses table
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    brand_tone TEXT,
    logo_url TEXT,
    target_location TEXT,
    target_age_min INTEGER,
    target_age_max INTEGER,
    target_gender TEXT,
    marketing_goal TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- RLS policies for businesses
CREATE POLICY "Users can view their own businesses"
ON public.businesses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own businesses"
ON public.businesses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses"
ON public.businesses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own businesses"
ON public.businesses
FOR DELETE
USING (auth.uid() = user_id);

-- Create business_assets table for media files
CREATE TABLE public.business_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    asset_type TEXT NOT NULL, -- 'logo', 'shop_photo', 'product_photo', 'product_video'
    file_url TEXT NOT NULL,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on business_assets
ALTER TABLE public.business_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_assets
CREATE POLICY "Users can view their own business assets"
ON public.business_assets
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.businesses
        WHERE businesses.id = business_assets.business_id
        AND businesses.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own business assets"
ON public.business_assets
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.businesses
        WHERE businesses.id = business_assets.business_id
        AND businesses.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own business assets"
ON public.business_assets
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.businesses
        WHERE businesses.id = business_assets.business_id
        AND businesses.user_id = auth.uid()
    )
);

-- Create token_packages table (admin managed)
CREATE TABLE public.token_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tokens INTEGER NOT NULL,
    price_inr DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on token_packages
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;

-- Everyone can view active packages
CREATE POLICY "Anyone can view active token packages"
ON public.token_packages
FOR SELECT
USING (is_active = true);

-- Admins can manage packages
CREATE POLICY "Admins can manage token packages"
ON public.token_packages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create user_tokens table
CREATE TABLE public.user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_tokens
CREATE POLICY "Users can view their own token balance"
ON public.user_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'purchase', 'spend', 'refund'
    amount INTEGER NOT NULL,
    description TEXT,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Create advertisements table
CREATE TABLE public.advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    ad_type TEXT NOT NULL, -- 'video', 'image'
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'generating', 'preview', 'approved', 'published'
    preview_url TEXT,
    final_url TEXT,
    duration_seconds INTEGER,
    platforms TEXT[], -- array of platforms
    ai_script TEXT,
    ai_captions TEXT,
    tokens_spent INTEGER DEFAULT 0,
    has_watermark BOOLEAN DEFAULT true,
    revision_count INTEGER DEFAULT 0,
    max_revisions INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on advertisements
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- RLS policies for advertisements
CREATE POLICY "Users can view their own advertisements"
ON public.advertisements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own advertisements"
ON public.advertisements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own advertisements"
ON public.advertisements
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own advertisements"
ON public.advertisements
FOR DELETE
USING (auth.uid() = user_id);

-- Create campaigns table
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    advertisement_id UUID REFERENCES public.advertisements(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    budget_inr DECIMAL(10,2),
    duration_days INTEGER,
    target_audience JSONB,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaigns
CREATE POLICY "Users can view their own campaigns"
ON public.campaigns
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
ON public.campaigns
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
ON public.campaigns
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Initialize token balance
    INSERT INTO public.user_tokens (user_id, balance)
    VALUES (NEW.id, 0);
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertisements_updated_at
    BEFORE UPDATE ON public.advertisements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for business assets
INSERT INTO storage.buckets (id, name, public) VALUES ('business-assets', 'business-assets', true);

-- Storage policies for business-assets bucket
CREATE POLICY "Users can view their own business assets files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own business assets files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'business-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own business assets files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'business-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert default token packages
INSERT INTO public.token_packages (name, tokens, price_inr, description) VALUES
('Starter', 50, 499, 'Perfect for trying out the platform'),
('Pro', 200, 1499, 'Best value for growing businesses'),
('Business', 500, 2999, 'For agencies and power users');