import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VotingPeriod } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useVotingPeriods() {
  const [periods, setPeriods] = useState<VotingPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('voting_periods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro ao carregar períodos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const formattedData: VotingPeriod[] = data.map(item => ({
        id: item.id,
        month: item.month,
        startDate: new Date(item.start_date),
        endDate: new Date(item.end_date),
        isActive: item.is_active,
        isFinalized: item.is_finalized
      }));

      setPeriods(formattedData);
    } catch (error) {
      toast({
        title: "Erro ao carregar períodos",
        description: "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPeriod = async (period: Omit<VotingPeriod, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('voting_periods')
        .insert([{
          month: period.month,
          start_date: period.startDate.toISOString(),
          end_date: period.endDate.toISOString(),
          is_active: period.isActive,
          is_finalized: period.isFinalized
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar período",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      const newPeriod: VotingPeriod = {
        id: data.id,
        month: data.month,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        isActive: data.is_active,
        isFinalized: data.is_finalized
      };

      setPeriods(prev => [newPeriod, ...prev]);
      
      toast({
        title: "Período criado",
        description: `Período para ${newPeriod.month} foi criado com sucesso.`,
      });

      return newPeriod;
    } catch (error) {
      toast({
        title: "Erro ao criar período",
        description: "Erro inesperado",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePeriod = async (id: string, updates: Partial<VotingPeriod>) => {
    try {
      const { error } = await supabase
        .from('voting_periods')
        .update({
          month: updates.month,
          start_date: updates.startDate?.toISOString(),
          end_date: updates.endDate?.toISOString(),
          is_active: updates.isActive,
          is_finalized: updates.isFinalized
        })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao atualizar período",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setPeriods(prev => 
        prev.map(p => p.id === id ? { ...p, ...updates } : p)
      );

      toast({
        title: "Período atualizado",
        description: "Período atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar período",
        description: "Erro inesperado",
        variant: "destructive",
      });
    }
  };

  const getActivePeriod = () => {
    return periods.find(p => p.isActive);
  };

  const getCurrentMonthPeriod = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    return periods.find(p => p.month === currentMonth);
  };

  return {
    periods,
    isLoading,
    createPeriod,
    updatePeriod,
    getActivePeriod,
    getCurrentMonthPeriod,
    reload: loadPeriods
  };
}