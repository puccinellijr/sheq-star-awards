-- Update the handle_new_user function to correctly read department and role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'gestor'), -- Read role from metadata
    COALESCE(NEW.raw_user_meta_data->>'department', 'TI') -- Read department from metadata
  );
  RETURN NEW;
END;
$function$