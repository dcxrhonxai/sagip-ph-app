-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create emergency_services table for real service locations
CREATE TABLE public.emergency_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  phone TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  city TEXT,
  is_national BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for emergency_services (public read access)
ALTER TABLE public.emergency_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view emergency services"
  ON public.emergency_services FOR SELECT
  USING (true);

-- Create emergency_alerts table for user alert history
CREATE TABLE public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emergency_type TEXT NOT NULL,
  situation TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Emergency alerts policies
CREATE POLICY "Users can view own alerts"
  ON public.emergency_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON public.emergency_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.emergency_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- Create personal_contacts table for user's emergency contacts
CREATE TABLE public.personal_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_contacts ENABLE ROW LEVEL SECURITY;

-- Personal contacts policies
CREATE POLICY "Users can view own contacts"
  ON public.personal_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON public.personal_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON personal_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON public.personal_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample emergency services data for Metro Manila
INSERT INTO public.emergency_services (name, type, phone, latitude, longitude, address, city, is_national) VALUES
('Emergency Hotline 911', 'all', '911', 14.5995, 120.9842, 'Nationwide', 'Philippines', true),
('Bureau of Fire Protection', 'fire', '(02) 8426-0219', 14.5995, 120.9842, 'National HQ', 'Manila', true),
('Philippine National Police', 'police', '117', 14.5995, 120.9842, 'National HQ', 'Manila', true),
('Philippine Red Cross', 'medical', '143', 14.5995, 120.9842, 'National HQ', 'Manila', true),
('NDRRMC', 'disaster', '(02) 8911-1406', 14.5995, 120.9842, 'Camp Aguinaldo', 'Quezon City', true),
('MMDA', 'accident', '136', 14.5995, 120.9842, 'EDSA', 'Makati', true),
('Makati Fire Station', 'fire', '(02) 8899-7272', 14.5547, 121.0244, 'Makati Ave', 'Makati', false),
('Makati Police Station', 'police', '(02) 8888-7777', 14.5524, 121.0196, 'Ayala Ave', 'Makati', false),
('Makati Medical Center', 'medical', '(02) 8888-8999', 14.5564, 121.0257, 'Amorsolo St', 'Makati', false),
('Manila Fire Station', 'fire', '(02) 8426-0246', 14.5958, 120.9772, 'Plaza Lawton', 'Manila', false),
('Manila Police District', 'police', '(02) 8527-5678', 14.6042, 120.9822, 'U.N. Avenue', 'Manila', false),
('Manila Medical Center', 'medical', '(02) 8523-8131', 14.5833, 120.9832, 'Taft Ave', 'Manila', false),
('Quezon City Fire Station', 'fire', '(02) 8988-4242', 14.6760, 121.0437, 'Quezon Ave', 'Quezon City', false),
('QCPD Station 1', 'police', '(02) 8924-7381', 14.6507, 121.0494, 'Quezon City', 'Quezon City', false),
('East Avenue Medical Center', 'medical', '(02) 8928-0611', 14.6511, 121.0485, 'East Ave', 'Quezon City', false);