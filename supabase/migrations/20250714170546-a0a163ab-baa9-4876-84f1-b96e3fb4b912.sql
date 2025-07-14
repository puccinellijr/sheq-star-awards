-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'gestor')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collaborators table
CREATE TABLE public.collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('funcionario', 'terceirizado')),
  company TEXT, -- For terceirizados
  photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create voting periods table
CREATE TABLE public.voting_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL, -- Format: "2024-01"
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_finalized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id UUID NOT NULL,
  voter_name TEXT NOT NULL,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  collaborator_name TEXT NOT NULL,
  collaborator_type TEXT NOT NULL CHECK (collaborator_type IN ('funcionario', 'terceirizado')),
  month TEXT NOT NULL,
  answers BOOLEAN[] NOT NULL,
  total_yes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly results table
CREATE TABLE public.monthly_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  funcionario_winner_id UUID REFERENCES public.collaborators(id),
  funcionario_total_votes INTEGER,
  funcionario_total_yes INTEGER,
  funcionario_is_tie_breaker BOOLEAN DEFAULT false,
  terceiro_winner_id UUID REFERENCES public.collaborators(id),
  terceiro_total_votes INTEGER,
  terceiro_total_yes INTEGER,
  terceiro_is_tie_breaker BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_results ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create policies for collaborators (admin/gestor can manage)
CREATE POLICY "Anyone can view collaborators" ON public.collaborators FOR SELECT USING (true);
CREATE POLICY "Admins can insert collaborators" ON public.collaborators FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
);
CREATE POLICY "Admins can update collaborators" ON public.collaborators FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
);
CREATE POLICY "Admins can delete collaborators" ON public.collaborators FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
);

-- Create policies for voting periods
CREATE POLICY "Anyone can view voting periods" ON public.voting_periods FOR SELECT USING (true);
CREATE POLICY "Admins can manage voting periods" ON public.voting_periods FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create policies for votes
CREATE POLICY "Users can view all votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON public.votes FOR INSERT WITH CHECK (voter_id = auth.uid()::text);

-- Create policies for monthly results
CREATE POLICY "Anyone can view monthly results" ON public.monthly_results FOR SELECT USING (true);
CREATE POLICY "Admins can manage monthly results" ON public.monthly_results FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaborators_updated_at
  BEFORE UPDATE ON public.collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voting_periods_updated_at
  BEFORE UPDATE ON public.voting_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'gestor', -- Default role
    'TI' -- Default department
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial collaborators data
INSERT INTO public.collaborators (name, department, type, company) VALUES
('Ezequel Froner', 'SHEQ', 'funcionario', NULL),
('Carlos Silva Santos', 'Operações', 'funcionario', NULL),
('Jacenir Pacheco Machado', 'Manutenção', 'terceirizado', 'Gocil'),
('Roberto Oliveira Lima', 'Segurança', 'terceirizado', 'Securitas');