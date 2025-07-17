-- Create system_settings table for persisting application settings
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can manage settings" 
ON public.system_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
('voting_period', '{"start_date": "", "end_date": "", "is_active": false}', 'Current voting period configuration'),
('email_notifications', '{"enabled": true, "voting_start": true, "voting_reminder": true, "voting_end": true, "reminder_days": 3}', 'Email notification settings'),
('tie_breaker_criteria', '{"funcionario": ["Pontualidade", "Qualidade do trabalho", "Relacionamento interpessoal"], "terceiro": ["Qualidade do serviço", "Pontualidade", "Cortesia"]}', 'Criteria for tie-breaking in votes'),
('general_settings', '{"max_votes_per_user": 3, "allow_self_voting": false, "results_visible_immediately": false, "certificate_generation": true}', 'General application settings'),
('email_template', '{"subject": "Votação {{type}} - {{month}}", "content": "Prezado(a) {{name}},\n\nEste é um lembrete sobre a votação do mês {{month}}.\n\nAtenciosamente,\nEquipe de Gestão"}', 'Email template for notifications');