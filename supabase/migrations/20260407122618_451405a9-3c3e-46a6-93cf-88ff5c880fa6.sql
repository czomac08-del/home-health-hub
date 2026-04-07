
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('homeowner', 'realtor', 'inspector', 'contractor');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'homeowner',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles table (separate from profiles per security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Primary Residence',
  is_active BOOLEAN NOT NULL DEFAULT true,
  health_score INTEGER DEFAULT 78,
  year_built TEXT,
  square_footage TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own properties" ON public.properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own properties" ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- System details table
CREATE TABLE public.system_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  install_date TEXT,
  purchase_date TEXT,
  warranty_exp TEXT,
  warranty_provider TEXT,
  extended_warranty BOOLEAN DEFAULT false,
  last_service TEXT,
  next_service TEXT,
  service_company TEXT,
  service_phone TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  location_in_home TEXT,
  health_score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'unconfigured',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, system_name)
);

ALTER TABLE public.system_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own system details" ON public.system_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own system details" ON public.system_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own system details" ON public.system_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own system details" ON public.system_details FOR DELETE USING (auth.uid() = user_id);

-- System photos table
CREATE TABLE public.system_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_detail_id UUID REFERENCES public.system_details(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Unit Photo',
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own photos" ON public.system_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own photos" ON public.system_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON public.system_photos FOR DELETE USING (auth.uid() = user_id);

-- System documents table
CREATE TABLE public.system_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_detail_id UUID REFERENCES public.system_details(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.system_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.system_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.system_documents FOR DELETE USING (auth.uid() = user_id);

-- Maintenance history table
CREATE TABLE public.maintenance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system_name TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_date TEXT NOT NULL,
  performed_by TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own maintenance" ON public.maintenance_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own maintenance" ON public.maintenance_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'homeowner')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'homeowner')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_details_updated_at BEFORE UPDATE ON public.system_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('system-photos', 'system-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('system-documents', 'system-documents', false);

-- Storage policies
CREATE POLICY "Users can upload system photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'system-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "System photos are public" ON storage.objects FOR SELECT USING (bucket_id = 'system-photos');
CREATE POLICY "Users can delete own system photos" ON storage.objects FOR DELETE USING (bucket_id = 'system-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload system documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'system-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own system documents" ON storage.objects FOR SELECT USING (bucket_id = 'system-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own system documents" ON storage.objects FOR DELETE USING (bucket_id = 'system-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
