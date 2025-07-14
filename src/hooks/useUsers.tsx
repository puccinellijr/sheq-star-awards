import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        toast({
          title: "Erro ao carregar usuários",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const formattedData: User[] = data.map(item => ({
        id: item.user_id,
        name: item.name,
        email: item.email,
        role: item.role as 'admin' | 'gestor',
        department: item.department,
        createdAt: new Date(item.created_at)
      }));

      setUsers(formattedData);
    } catch (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          role: updates.role,
          department: updates.department
        })
        .eq('user_id', id);

      if (error) {
        toast({
          title: "Erro ao atualizar usuário",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setUsers(prev => 
        prev.map(u => u.id === id ? { ...u, ...updates } : u)
      );

      toast({
        title: "Usuário atualizado",
        description: "Dados atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar usuário",
        description: "Erro inesperado",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (id: string) => {
    try {
      // Note: This will also delete from auth.users due to foreign key constraints
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', id);

      if (error) {
        toast({
          title: "Erro ao excluir usuário",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setUsers(prev => prev.filter(u => u.id !== id));
      
      toast({
        title: "Usuário excluído",
        description: "Usuário removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir usuário",
        description: "Erro inesperado",
        variant: "destructive",
      });
    }
  };

  const getUsersByRole = (role: 'admin' | 'gestor') => {
    return users.filter(u => u.role === role);
  };

  return {
    users,
    isLoading,
    updateUser,
    deleteUser,
    getUsersByRole,
    reload: loadUsers
  };
}