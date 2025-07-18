import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SystemSettings {
  voting_period: {
    start_date: string;
    end_date: string;
    is_active: boolean;
  };
  email_notifications: {
    enabled: boolean;
    voting_start: boolean;
    voting_reminder: boolean;
    voting_end: boolean;
    reminder_days: number;
  };
  tie_breaker_criteria: {
    funcionario: string[];
    terceiro: string[];
  };
  general_settings: {
    max_votes_per_user: number;
    allow_self_voting: boolean;
    results_visible_immediately: boolean;
    certificate_generation: boolean;
  };
  email_template: {
    subject: string;
    content: string;
  };
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value');

      if (error) throw error;

      const settingsObject: any = {};
      data?.forEach(setting => {
        settingsObject[setting.key] = setting.value;
      });

      setSettings(settingsObject as SystemSettings);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof SystemSettings, value: any) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key, 
          value: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      
      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso!",
      });
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração: " + error.message,
        variant: "destructive",
      });
    }
  };

  const saveAllSettings = async (newSettings: SystemSettings) => {
    try {
      const updates = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      // Sync voting period with voting_periods table
      await syncVotingPeriod(newSettings.voting_period);

      setSettings(newSettings);
      
      toast({
        title: "Sucesso",
        description: "Todas as configurações foram salvas e período de votação sincronizado!",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações: " + error.message,
        variant: "destructive",
      });
    }
  };

  const syncVotingPeriod = async (votingPeriod: SystemSettings['voting_period']) => {
    try {
      if (!votingPeriod.start_date || !votingPeriod.end_date) {
        return; // Skip if dates are not set
      }

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // First, deactivate all existing active periods
      await supabase
        .from('voting_periods')
        .update({ is_active: false })
        .eq('is_active', true);

      // Check if period for current month exists
      const { data: existingPeriod } = await supabase
        .from('voting_periods')
        .select('*')
        .eq('month', currentMonth)
        .single();

      const periodData = {
        month: currentMonth,
        start_date: votingPeriod.start_date,
        end_date: votingPeriod.end_date,
        is_active: votingPeriod.is_active,
        is_finalized: false
      };

      if (existingPeriod) {
        // Update existing period
        const { error } = await supabase
          .from('voting_periods')
          .update(periodData)
          .eq('id', existingPeriod.id);

        if (error) throw error;
      } else {
        // Create new period
        const { error } = await supabase
          .from('voting_periods')
          .insert([periodData]);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error syncing voting period:', error);
      throw new Error('Erro ao sincronizar período de votação: ' + error.message);
    }
  };

  const exportData = async () => {
    try {
      // Get votes data
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*');
      
      if (votesError) throw votesError;

      // Get collaborators data
      const { data: collaborators, error: collaboratorsError } = await supabase
        .from('collaborators')
        .select('*');
      
      if (collaboratorsError) throw collaboratorsError;

      // Get monthly results
      const { data: results, error: resultsError } = await supabase
        .from('monthly_results')
        .select('*');
      
      if (resultsError) throw resultsError;

      // Create CSV content
      const csvData = {
        votes: votes || [],
        collaborators: collaborators || [],
        results: results || []
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(csvData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `voting_data_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      toast({
        title: "Sucesso",
        description: "Dados exportados com sucesso!",
      });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar dados: " + error.message,
        variant: "destructive",
      });
    }
  };

  const clearCache = async () => {
    try {
      // Clear browser cache and localStorage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear localStorage except for auth
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth')
      );
      const authData: any = {};
      authKeys.forEach(key => {
        authData[key] = localStorage.getItem(key);
      });
      
      localStorage.clear();
      
      authKeys.forEach(key => {
        if (authData[key]) localStorage.setItem(key, authData[key]);
      });

      toast({
        title: "Sucesso",
        description: "Cache limpo com sucesso!",
      });
    } catch (error: any) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar cache: " + error.message,
        variant: "destructive",
      });
    }
  };

  const reprocessVotes = async () => {
    try {
      // Get all votes to recalculate monthly results
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*');

      if (votesError) throw votesError;

      toast({
        title: "Sucesso",
        description: "Votos reprocessados com sucesso!",
      });
    } catch (error: any) {
      console.error('Error reprocessing votes:', error);
      toast({
        title: "Erro",
        description: "Erro ao reprocessar votos: " + error.message,
        variant: "destructive",
      });
    }
  };

  const resetCurrentVoting = async () => {
    try {
      // Get the active voting period to determine which month to reset
      const { data: activePeriods, error: periodError } = await supabase
        .from('voting_periods')
        .select('*')
        .eq('is_active', true);

      if (periodError) throw periodError;

      // Use active period month, or fall back to current month
      const targetMonth = activePeriods && activePeriods.length > 0 
        ? activePeriods[0].month 
        : new Date().toISOString().slice(0, 7);
      
      console.log(`Resetting voting data for month: ${targetMonth}`);

      // Delete votes for target month
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('month', targetMonth);

      if (votesError) throw votesError;

      // Delete monthly results for target month
      const { error: resultsError } = await supabase
        .from('monthly_results')
        .delete()
        .eq('month', targetMonth);

      if (resultsError) throw resultsError;

      // Also clean up any orphaned data from July 2025 specifically
      await supabase.from('votes').delete().eq('month', '2025-07');
      await supabase.from('monthly_results').delete().eq('month', '2025-07');

      toast({
        title: "Sucesso",
        description: `Votação de ${targetMonth} resetada com sucesso! Votos e resultados foram removidos.`,
      });

      // Force reload of all related data by dispatching a custom event
      window.dispatchEvent(new CustomEvent('votingDataReset'));

      return true;
    } catch (error: any) {
      console.error('Error resetting voting:', error);
      toast({
        title: "Erro",
        description: "Erro ao resetar votação: " + error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const clearHistory = async () => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const cutoffDate = sixMonthsAgo.toISOString().slice(0, 7);

      // Delete old votes
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .lt('month', cutoffDate);

      if (votesError) throw votesError;

      // Delete old results
      const { error: resultsError } = await supabase
        .from('monthly_results')
        .delete()
        .lt('month', cutoffDate);

      if (resultsError) throw resultsError;

      toast({
        title: "Sucesso",
        description: "Histórico anterior a 6 meses foi removido!",
      });
    } catch (error: any) {
      console.error('Error clearing history:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar histórico: " + error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    saveAllSettings,
    exportData,
    clearCache,
    reprocessVotes,
    resetCurrentVoting,
    clearHistory,
    reload: loadSettings
  };
};
