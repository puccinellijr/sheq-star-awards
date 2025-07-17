-- Fix admin user_id to match the actual auth user
UPDATE public.profiles 
SET user_id = '1d5e4107-208e-4ff6-9188-caaa506e47c0'
WHERE email = 'admin@odfjell.com' AND role = 'admin';

-- Create trigger to automatically create profiles for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clean up duplicate admin@odfjellterminals.com.br entries, keeping only admin role
DELETE FROM public.profiles 
WHERE email = 'admin@odfjellterminals.com.br' AND role = 'gestor';