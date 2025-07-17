import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Calendar, Mail, Send, Settings, Download, Trash, RefreshCw, RotateCcw, Archive, AlertTriangle } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const AdminSettings = () => {
  const { toast } = useToast();
  const { 
    settings: systemSettings, 
    isLoading, 
    saveAllSettings, 
    exportData,
    clearCache,
    reprocessVotes,
    resetCurrentVoting,
    clearHistory
  } = useSystemSettings();
  
  const [isSending, setIsSending] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    // Voting Period Settings
    votingStartDate: "",
    votingEndDate: "",
    isVotingActive: false,
    
    // Email Notification Settings
    emailNotificationsEnabled: true,
    notifyVotingStart: true,
    notifyVotingReminder: true,
    notifyVotingEnd: true,
    reminderDaysBeforeEnd: 3,
    
    // Tie-breaker Criteria
    funcionarioCriteria: ["Pontualidade", "Qualidade do trabalho", "Relacionamento interpessoal"],
    terceiroCriteria: ["Qualidade do serviço", "Pontualidade", "Cortesia"],
    
    // General Settings
    maxVotesPerUser: 3,
    allowSelfVoting: false,
    resultsVisibleImmediately: false,
    certificateGeneration: true,
    
    // Email Template
    emailSubject: "Votação {{type}} - {{month}}",
    emailContent: "Prezado(a) {{name}},\n\nEste é um lembrete sobre a votação do mês {{month}}.\n\nAtenciosamente,\nEquipe de Gestão"
  });

  useEffect(() => {
    // Load settings from database
    if (systemSettings) {
      setLocalSettings(prev => ({
        ...prev,
        votingStartDate: systemSettings.voting_period?.start_date || "",
        votingEndDate: systemSettings.voting_period?.end_date || "",
        isVotingActive: systemSettings.voting_period?.is_active || false,
        emailNotificationsEnabled: systemSettings.email_notifications?.enabled || true,
        notifyVotingStart: systemSettings.email_notifications?.voting_start || true,
        notifyVotingReminder: systemSettings.email_notifications?.voting_reminder || true,
        notifyVotingEnd: systemSettings.email_notifications?.voting_end || true,
        reminderDaysBeforeEnd: systemSettings.email_notifications?.reminder_days || 3,
        funcionarioCriteria: systemSettings.tie_breaker_criteria?.funcionario || ["Pontualidade", "Qualidade do trabalho", "Relacionamento interpessoal"],
        terceiroCriteria: systemSettings.tie_breaker_criteria?.terceiro || ["Qualidade do serviço", "Pontualidade", "Cortesia"],
        maxVotesPerUser: systemSettings.general_settings?.max_votes_per_user || 3,
        allowSelfVoting: systemSettings.general_settings?.allow_self_voting || false,
        resultsVisibleImmediately: systemSettings.general_settings?.results_visible_immediately || false,
        certificateGeneration: systemSettings.general_settings?.certificate_generation || true,
        emailSubject: systemSettings.email_template?.subject || "Votação {{type}} - {{month}}",
        emailContent: systemSettings.email_template?.content || `Prezado(a) {{name}},\n\nEste é um lembrete sobre a votação do mês {{month}}.\n\nAtenciosamente,\nEquipe de Gestão`
      }));
    }
  }, [systemSettings]);

  const handleSave = async () => {
    if (!systemSettings) return;
    
    const updatedSettings = {
      voting_period: {
        start_date: localSettings.votingStartDate,
        end_date: localSettings.votingEndDate,
        is_active: localSettings.isVotingActive
      },
      email_notifications: {
        enabled: localSettings.emailNotificationsEnabled,
        voting_start: localSettings.notifyVotingStart,
        voting_reminder: localSettings.notifyVotingReminder,
        voting_end: localSettings.notifyVotingEnd,
        reminder_days: localSettings.reminderDaysBeforeEnd
      },
      tie_breaker_criteria: {
        funcionario: localSettings.funcionarioCriteria,
        terceiro: localSettings.terceiroCriteria
      },
      general_settings: {
        max_votes_per_user: localSettings.maxVotesPerUser,
        allow_self_voting: localSettings.allowSelfVoting,
        results_visible_immediately: localSettings.resultsVisibleImmediately,
        certificate_generation: localSettings.certificateGeneration
      },
      email_template: {
        subject: localSettings.emailSubject,
        content: localSettings.emailContent
      }
    };

    await saveAllSettings(updatedSettings);
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const sendNotification = async (type: 'voting_start' | 'voting_reminder' | 'voting_end') => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: {
          type,
          month: new Date().toISOString().slice(0, 7)
        }
      });

      if (error) throw error;

      toast({
        title: "Notificações enviadas!",
        description: `E-mails de ${type} enviados com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast({
        title: "Erro ao enviar notificações",
        description: error.message || "Erro inesperado. Verifique se o RESEND_API_KEY está configurado.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Configurações">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Carregando configurações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isLoading ? "Carregando..." : "Salvar Configurações"}
          </Button>
        </div>

        {/* Voting Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Período de Votação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="votingStartDate">Data Inicial</Label>
                <Input
                  type="date"
                  value={localSettings.votingStartDate}
                  onChange={(e) => updateSetting('votingStartDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="votingEndDate">Data Final</Label>
                <Input
                  type="date"
                  value={localSettings.votingEndDate}
                  onChange={(e) => updateSetting('votingEndDate', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isVotingActive"
                checked={localSettings.isVotingActive}
                onCheckedChange={(checked) => updateSetting('isVotingActive', checked)}
              />
              <Label htmlFor="isVotingActive">Votação Ativa</Label>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Notificações por Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="emailNotifications"
                checked={localSettings.emailNotificationsEnabled}
                onCheckedChange={(checked) => updateSetting('emailNotificationsEnabled', checked)}
              />
              <Label htmlFor="emailNotifications">Habilitar notificações por email</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyVotingStart"
                  checked={localSettings.notifyVotingStart}
                  onCheckedChange={(checked) => updateSetting('notifyVotingStart', checked)}
                  disabled={!localSettings.emailNotificationsEnabled}
                />
                <Label htmlFor="notifyVotingStart">Início da votação</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyVotingReminder"
                  checked={localSettings.notifyVotingReminder}
                  onCheckedChange={(checked) => updateSetting('notifyVotingReminder', checked)}
                  disabled={!localSettings.emailNotificationsEnabled}
                />
                <Label htmlFor="notifyVotingReminder">Lembrete de votação</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyVotingEnd"
                  checked={localSettings.notifyVotingEnd}
                  onCheckedChange={(checked) => updateSetting('notifyVotingEnd', checked)}
                  disabled={!localSettings.emailNotificationsEnabled}
                />
                <Label htmlFor="notifyVotingEnd">Final da votação</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminderDays">Dias antes do fim para lembrete</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.reminderDaysBeforeEnd}
                  onChange={(e) => updateSetting('reminderDaysBeforeEnd', parseInt(e.target.value))}
                  disabled={!localSettings.emailNotificationsEnabled}
                />
              </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Envio Manual de Notificações</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => sendNotification('voting_start')}
                  disabled={isSending || !localSettings.emailNotificationsEnabled}
                  variant="outline"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Início da Votação
                </Button>
                <Button
                  onClick={() => sendNotification('voting_reminder')}
                  disabled={isSending || !localSettings.emailNotificationsEnabled}
                  variant="outline"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Lembrete
                </Button>
                <Button
                  onClick={() => sendNotification('voting_end')}
                  disabled={isSending || !localSettings.emailNotificationsEnabled}
                  variant="outline"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Fim da Votação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Criteria and Results */}
        <Card>
          <CardHeader>
            <CardTitle>Critérios e Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Critérios para Funcionários (em caso de empate)</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                {localSettings.funcionarioCriteria.map((criterion, index) => (
                  <div key={index}>• {criterion}</div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Critérios para Terceiros (em caso de empate)</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                {localSettings.terceiroCriteria.map((criterion, index) => (
                  <div key={index}>• {criterion}</div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxVotes">Máximo de votos por usuário</Label>
                <Input
                  id="maxVotes"
                  type="number"
                  min="1"
                  max="10"
                  value={localSettings.maxVotesPerUser}
                  onChange={(e) => updateSetting('maxVotesPerUser', parseInt(e.target.value))}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="allowSelfVoting"
                  checked={localSettings.allowSelfVoting}
                  onCheckedChange={(checked) => updateSetting('allowSelfVoting', checked)}
                />
                <Label htmlFor="allowSelfVoting">Permitir auto-votação</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="resultsVisible"
                  checked={localSettings.resultsVisibleImmediately}
                  onCheckedChange={(checked) => updateSetting('resultsVisibleImmediately', checked)}
                />
                <Label htmlFor="resultsVisible">Resultados visíveis imediatamente</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="certificateGeneration"
                  checked={localSettings.certificateGeneration}
                  onCheckedChange={(checked) => updateSetting('certificateGeneration', checked)}
                />
                <Label htmlFor="certificateGeneration">Geração automática de certificados</Label>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Template de Email</h4>
              
              <div className="space-y-2">
                <Label htmlFor="emailSubject">Assunto do Email</Label>
                <Input
                  id="emailSubject"
                  value={localSettings.emailSubject}
                  onChange={(e) => updateSetting('emailSubject', e.target.value)}
                  placeholder="{{type}} será substituído pelo tipo de notificação"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailContent">Conteúdo do Email</Label>
                <Textarea
                  id="emailContent"
                  rows={8}
                  value={localSettings.emailContent}
                  onChange={(e) => updateSetting('emailContent', e.target.value)}
                  placeholder="{{name}} e {{month}} serão substituídos pelos valores reais"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                Variáveis disponíveis: {`{{name}}`} (nome do usuário), {`{{month}}`} (mês), {`{{type}}`} (tipo de notificação)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Avançadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Dados
              </Button>
              
              <Button variant="outline" onClick={clearCache}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpar Cache
              </Button>
              
              <Button variant="outline" onClick={reprocessVotes}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reprocessar Votos
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Trash className="w-4 h-4 mr-2" />
                    Resetar Votação Atual
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Reset</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover todos os votos do período atual e não pode ser desfeita. 
                      Tem certeza que deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={resetCurrentVoting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Confirmar Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Archive className="w-4 h-4 mr-2" />
                    Limpar Histórico
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <AlertTriangle className="w-5 h-5 inline mr-2 text-destructive" />
                      Atenção: Ação Irreversível
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover permanentemente todos os dados de votação e resultados 
                      anteriores a 6 meses. Esta operação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Confirmar Limpeza
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Funcionalidades avançadas:</p>
              <ul className="space-y-1">
                <li>• <strong>Exportar Dados:</strong> Baixa todos os dados de votação em formato JSON</li>
                <li>• <strong>Limpar Cache:</strong> Remove dados temporários do sistema</li>
                <li>• <strong>Reprocessar Votos:</strong> Recalcula todos os resultados mensais</li>
                <li>• <strong>Resetar Votação Atual:</strong> Remove todos os votos do período ativo</li>
                <li>• <strong>Limpar Histórico:</strong> Remove dados de votações antigas (&gt;6 meses)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;