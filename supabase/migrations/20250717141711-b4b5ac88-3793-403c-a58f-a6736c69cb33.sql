-- Limpar registros duplicados do admin, mantendo apenas o com role admin
DELETE FROM public.profiles 
WHERE email = 'admin@odfjell.com' AND role = 'gestor';