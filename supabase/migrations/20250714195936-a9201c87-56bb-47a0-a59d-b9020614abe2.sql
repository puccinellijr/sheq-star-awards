-- Create admin user profile
INSERT INTO public.profiles (user_id, name, email, role, department)
VALUES (
  gen_random_uuid(),
  'Administrador Sistema',
  'admin@odfjell.com',
  'admin',
  'TI'
) ON CONFLICT DO NOTHING;

-- Also create a backup admin with a different email
INSERT INTO public.profiles (user_id, name, email, role, department)
VALUES (
  gen_random_uuid(),
  'Admin Odfjell',
  'admin@odfjellterminals.com.br',
  'admin',
  'Administração'
) ON CONFLICT DO NOTHING;