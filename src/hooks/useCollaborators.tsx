import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Collaborator } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCollaborators();
  }, []);

  const loadCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        toast({
          title: "Erro ao carregar colaboradores",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const formattedData: Collaborator[] = data.map(item => ({
        id: item.id,
        name: item.name,
        department: item.department,
        type: item.type as 'funcionario' | 'terceirizado',
        company: item.company,
        photo: item.photo,
        createdAt: new Date(item.created_at)
      }));

      setCollaborators(formattedData);
    } catch (error) {
      toast({
        title: "Erro ao carregar colaboradores",
        description: "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCollaborator = async (collaborator: Omit<Collaborator, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .insert([{
          name: collaborator.name,
          department: collaborator.department,
          type: collaborator.type,
          company: collaborator.company,
          photo: collaborator.photo
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao adicionar colaborador",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      const newCollaborator: Collaborator = {
        id: data.id,
        name: data.name,
        department: data.department,
        type: data.type as 'funcionario' | 'terceirizado',
        company: data.company,
        photo: data.photo,
        createdAt: new Date(data.created_at)
      };

      setCollaborators(prev => [...prev, newCollaborator]);
      
      toast({
        title: "Colaborador adicionado",
        description: `${newCollaborator.name} foi adicionado com sucesso.`,
      });

      return newCollaborator;
    } catch (error) {
      toast({
        title: "Erro ao adicionar colaborador",
        description: "Erro inesperado",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCollaborator = async (id: string, updates: Partial<Collaborator>) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .update({
          name: updates.name,
          department: updates.department,
          type: updates.type,
          company: updates.company,
          photo: updates.photo
        })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao atualizar colaborador",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setCollaborators(prev => 
        prev.map(c => c.id === id ? { ...c, ...updates } : c)
      );

      toast({
        title: "Colaborador atualizado",
        description: "Dados atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar colaborador",
        description: "Erro inesperado",
        variant: "destructive",
      });
    }
  };

  const deleteCollaborator = async (id: string) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao excluir colaborador",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setCollaborators(prev => prev.filter(c => c.id !== id));
      
      toast({
        title: "Colaborador excluído",
        description: "Colaborador removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir colaborador",
        description: "Erro inesperado",
        variant: "destructive",
      });
    }
  };

  const getCollaboratorsByType = (type: 'funcionario' | 'terceirizado') => {
    return collaborators.filter(c => c.type === type);
  };

  const addMultipleCollaborators = async (collaborators: Omit<Collaborator, 'id' | 'createdAt'>[]) => {
    try {
      const insertData = collaborators.map(c => ({
        name: c.name,
        department: c.department,
        type: c.type,
        company: c.company,
        photo: c.photo
      }));

      const { data, error } = await supabase
        .from('collaborators')
        .insert(insertData)
        .select();

      if (error) {
        toast({
          title: "Erro ao importar colaboradores",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      const newCollaborators: Collaborator[] = data.map(item => ({
        id: item.id,
        name: item.name,
        department: item.department,
        type: item.type as 'funcionario' | 'terceirizado',
        company: item.company,
        photo: item.photo,
        createdAt: new Date(item.created_at)
      }));

      setCollaborators(prev => [...prev, ...newCollaborators]);
      
      toast({
        title: "Colaboradores importados",
        description: `${newCollaborators.length} colaboradores foram adicionados com sucesso.`,
      });

      return newCollaborators;
    } catch (error) {
      toast({
        title: "Erro ao importar colaboradores",
        description: "Erro inesperado durante a importação",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    collaborators,
    isLoading,
    addCollaborator,
    addMultipleCollaborators,
    updateCollaborator,
    deleteCollaborator,
    getCollaboratorsByType,
    reload: loadCollaborators
  };
}