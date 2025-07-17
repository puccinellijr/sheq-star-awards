import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import Dashboard from "./Dashboard";

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    console.log('🔄 Index page: Still loading auth state...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando autenticação...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Verificando console para logs de debug
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <Dashboard />;
};

export default Index;
