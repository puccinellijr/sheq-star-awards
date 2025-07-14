import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MonthlyResult, Collaborator } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useResults() {
  const [results, setResults] = useState<MonthlyResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_results')
        .select(`
          *,
          funcionario_winner:collaborators!funcionario_winner_id(*),
          terceiro_winner:collaborators!terceiro_winner_id(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading results:', error);
        return;
      }

      const formattedData: MonthlyResult[] = data.map(item => ({
        month: item.month,
        funcionarioWinner: item.funcionario_winner ? {
          collaborator: {
            id: item.funcionario_winner.id,
            name: item.funcionario_winner.name,
            department: item.funcionario_winner.department,
            type: 'funcionario' as const,
            company: item.funcionario_winner.company,
            photo: item.funcionario_winner.photo,
            createdAt: new Date(item.funcionario_winner.created_at)
          },
          totalVotes: item.funcionario_total_votes || 0,
          totalYesAnswers: item.funcionario_total_yes || 0,
          isTieBreaker: item.funcionario_is_tie_breaker || false
        } : undefined,
        terceiroWinner: item.terceiro_winner ? {
          collaborator: {
            id: item.terceiro_winner.id,
            name: item.terceiro_winner.name,
            department: item.terceiro_winner.department,
            type: 'terceirizado' as const,
            company: item.terceiro_winner.company,
            photo: item.terceiro_winner.photo,
            createdAt: new Date(item.terceiro_winner.created_at)
          },
          totalVotes: item.terceiro_total_votes || 0,
          totalYesAnswers: item.terceiro_total_yes || 0,
          isTieBreaker: item.terceiro_is_tie_breaker || false
        } : undefined
      }));

      setResults(formattedData);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateWinners = async (month: string) => {
    try {
      setIsLoading(true);

      // Get all votes for the month
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('month', month);

      if (votesError) {
        toast({
          title: "Erro ao calcular vencedores",
          description: votesError.message,
          variant: "destructive",
        });
        return null;
      }

      if (!votes || votes.length === 0) {
        toast({
          title: "Sem votos",
          description: "Não há votos registrados para este mês.",
          variant: "destructive",
        });
        return null;
      }

      // Calculate winners for funcionarios
      const funcionarioVotes = votes.filter(v => v.collaborator_type === 'funcionario');
      const funcionarioStats = calculateCollaboratorStats(funcionarioVotes);
      const funcionarioWinner = determineWinner(funcionarioStats);

      // Calculate winners for terceirizados
      const terceiroVotes = votes.filter(v => v.collaborator_type === 'terceirizado');
      const terceiroStats = calculateCollaboratorStats(terceiroVotes);
      const terceiroWinner = determineWinner(terceiroStats);

      // Get collaborator details
      let funcionarioCollaborator = null;
      let terceiroCollaborator = null;

      if (funcionarioWinner) {
        const { data: funcCollab } = await supabase
          .from('collaborators')
          .select('*')
          .eq('id', funcionarioWinner.collaboratorId)
          .single();
        funcionarioCollaborator = funcCollab;
      }

      if (terceiroWinner) {
        const { data: tercCollab } = await supabase
          .from('collaborators')
          .select('*')
          .eq('id', terceiroWinner.collaboratorId)
          .single();
        terceiroCollaborator = tercCollab;
      }

      // Save results to database
      const { data: savedResult, error: saveError } = await supabase
        .from('monthly_results')
        .upsert({
          month,
          funcionario_winner_id: funcionarioWinner?.collaboratorId || null,
          funcionario_total_votes: funcionarioWinner?.totalVotes || 0,
          funcionario_total_yes: funcionarioWinner?.totalYesAnswers || 0,
          funcionario_is_tie_breaker: funcionarioWinner?.isTieBreaker || false,
          terceiro_winner_id: terceiroWinner?.collaboratorId || null,
          terceiro_total_votes: terceiroWinner?.totalVotes || 0,
          terceiro_total_yes: terceiroWinner?.totalYesAnswers || 0,
          terceiro_is_tie_breaker: terceiroWinner?.isTieBreaker || false
        })
        .select()
        .single();

      if (saveError) {
        toast({
          title: "Erro ao salvar resultados",
          description: saveError.message,
          variant: "destructive",
        });
        return null;
      }

      // Create the result object
      const result: MonthlyResult = {
        month,
        funcionarioWinner: funcionarioCollaborator && funcionarioWinner ? {
          collaborator: {
            id: funcionarioCollaborator.id,
            name: funcionarioCollaborator.name,
            department: funcionarioCollaborator.department,
            type: 'funcionario',
            company: funcionarioCollaborator.company,
            photo: funcionarioCollaborator.photo,
            createdAt: new Date(funcionarioCollaborator.created_at)
          },
          totalVotes: funcionarioWinner.totalVotes,
          totalYesAnswers: funcionarioWinner.totalYesAnswers,
          isTieBreaker: funcionarioWinner.isTieBreaker
        } : undefined,
        terceiroWinner: terceiroCollaborator && terceiroWinner ? {
          collaborator: {
            id: terceiroCollaborator.id,
            name: terceiroCollaborator.name,
            department: terceiroCollaborator.department,
            type: 'terceirizado',
            company: terceiroCollaborator.company,
            photo: terceiroCollaborator.photo,
            createdAt: new Date(terceiroCollaborator.created_at)
          },
          totalVotes: terceiroWinner.totalVotes,
          totalYesAnswers: terceiroWinner.totalYesAnswers,
          isTieBreaker: terceiroWinner.isTieBreaker
        } : undefined
      };

      await loadResults(); // Reload results
      
      toast({
        title: "Vencedores calculados!",
        description: "Os vencedores do mês foram determinados com sucesso.",
      });

      return result;
    } catch (error) {
      console.error('Error calculating winners:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao calcular vencedores.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCollaboratorStats = (votes: any[]) => {
    const stats: { [key: string]: { totalVotes: number; totalYesAnswers: number; collaboratorId: string } } = {};

    votes.forEach(vote => {
      const id = vote.collaborator_id;
      if (!stats[id]) {
        stats[id] = {
          collaboratorId: id,
          totalVotes: 0,
          totalYesAnswers: 0
        };
      }
      stats[id].totalVotes++;
      stats[id].totalYesAnswers += vote.total_yes;
    });

    return Object.values(stats);
  };

  const determineWinner = (stats: any[]) => {
    if (stats.length === 0) return null;

    // Sort by total "yes" answers first, then by total votes
    stats.sort((a, b) => {
      if (b.totalYesAnswers !== a.totalYesAnswers) {
        return b.totalYesAnswers - a.totalYesAnswers;
      }
      return b.totalVotes - a.totalVotes;
    });

    const winner = stats[0];
    
    // Check if there's a tie (same total yes answers and same total votes)
    const isTieBreaker = stats.length > 1 && 
      stats[1].totalYesAnswers === winner.totalYesAnswers &&
      stats[1].totalVotes === winner.totalVotes;

    return {
      ...winner,
      isTieBreaker
    };
  };

  const getResultByMonth = (month: string) => {
    return results.find(r => r.month === month) || null;
  };

  return {
    results,
    isLoading,
    calculateWinners,
    getResultByMonth,
    reload: loadResults
  };
}