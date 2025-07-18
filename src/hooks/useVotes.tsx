
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Vote } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export function useVotes() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadVotes();
    
    // Listen for voting data reset events
    const handleVotingDataReset = () => {
      console.log('Votes hook: received reset event, reloading votes...');
      loadVotes();
    };

    window.addEventListener('votingDataReset', handleVotingDataReset);
    return () => window.removeEventListener('votingDataReset', handleVotingDataReset);
  }, []);

  const loadVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro ao carregar votos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const formattedData: Vote[] = data.map(item => ({
        id: item.id,
        voterId: item.voter_id,
        voterName: item.voter_name,
        collaboratorId: item.collaborator_id,
        collaboratorName: item.collaborator_name,
        collaboratorType: item.collaborator_type as 'funcionario' | 'terceirizado',
        month: item.month,
        answers: item.answers,
        totalYes: item.total_yes,
        createdAt: new Date(item.created_at)
      }));

      setVotes(formattedData);
    } catch (error) {
      toast({
        title: "Erro ao carregar votos",
        description: "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitVote = async (vote: Omit<Vote, 'id' | 'createdAt'>) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Check if user already voted for this collaborator this month
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('voter_id', vote.voterId)
        .eq('collaborator_id', vote.collaboratorId)
        .eq('month', vote.month)
        .single();

      if (existingVote) {
        toast({
          title: "Voto já registrado",
          description: "Você já votou neste colaborador este mês.",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('votes')
        .insert([{
          voter_id: vote.voterId,
          voter_name: vote.voterName,
          collaborator_id: vote.collaboratorId,
          collaborator_name: vote.collaboratorName,
          collaborator_type: vote.collaboratorType,
          month: vote.month,
          answers: vote.answers,
          total_yes: vote.totalYes
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao registrar voto",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      const newVote: Vote = {
        id: data.id,
        voterId: data.voter_id,
        voterName: data.voter_name,
        collaboratorId: data.collaborator_id,
        collaboratorName: data.collaborator_name,
        collaboratorType: data.collaborator_type as 'funcionario' | 'terceirizado',
        month: data.month,
        answers: data.answers,
        totalYes: data.total_yes,
        createdAt: new Date(data.created_at)
      };

      setVotes(prev => [newVote, ...prev]);

      toast({
        title: "Voto registrado",
        description: `Seu voto para ${newVote.collaboratorName} foi registrado com sucesso.`,
      });

      return newVote;
    } catch (error) {
      toast({
        title: "Erro ao registrar voto",
        description: "Erro inesperado",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteVotesByMonth = async (month: string) => {
    try {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('month', month);

      if (error) {
        toast({
          title: "Erro ao deletar votos",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Reload votes after deletion
      await loadVotes();
      return true;
    } catch (error) {
      toast({
        title: "Erro ao deletar votos",
        description: "Erro inesperado",
        variant: "destructive",
      });
      return false;
    }
  };

  const getVotesByMonth = (month: string) => {
    return votes.filter(v => v.month === month);
  };

  const getVotesByCollaborator = (collaboratorId: string) => {
    return votes.filter(v => v.collaboratorId === collaboratorId);
  };

  const hasUserVoted = (userId: string, month: string) => {
    // Check if user has voted in the specified month (for any collaborator)
    return votes.some(v => 
      v.voterId === userId && 
      v.month === month
    );
  };

  return {
    votes,
    isLoading,
    submitVote,
    deleteVotesByMonth,
    getVotesByMonth,
    getVotesByCollaborator,
    hasUserVoted,
    reload: loadVotes
  };
}
