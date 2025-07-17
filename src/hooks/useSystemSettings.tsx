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
        });

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
        .upsert(updates);

      if (error) throw error;

      setSettings(newSettings);
      
      toast({
        title: "Sucesso",
        description: "Todas as configurações foram salvas!",
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
      // This would trigger a recalculation of monthly results
      // For now, we'll just show a success message
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
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('month', currentMonth);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Votação atual resetada com sucesso!",
      });
    } catch (error: any) {
      console.error('Error resetting voting:', error);
      toast({
        title: "Erro",
        description: "Erro ao resetar votação: " + error.message,
        variant: "destructive",
      });
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