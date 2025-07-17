import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useVotingPeriods } from "@/hooks/useVotingPeriods";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Mail, Calendar, Shield, Save, Send } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const { getActivePeriod } = useVotingPeriods();
  const [isLoadingNotification, setIsLoadingNotification] = useState(false);
  const activePeriod = getActivePeriod();
  const [settings, setSettings] = useState({
    // Configurações de Votação
    votingEnabled: true,
    votingStartDay: 1,
    votingEndDay: 25,
    
    // Notificações por E-mail
    emailNotifications: true,
    reminderDays: 2,
    emailTemplate: "Olá [NOME],\n\nO período de votação SHEQ está aberto até [DATA_FIM].\nClique aqui para votar: [LINK]\n\nAtenciosamente,\nSistema SHEQ Odfjell",
    
    // Critérios de Desempate
    tieBreakingCriteria: [
      "Maior número de respostas 'Sim'",
      "Sorteio aleatório"
    ],
    
    // Configurações Gerais
    allowLateVoting: false,
    showRealTimeResults: false,
    requireAllAnswers: true
  });

  const handleSave = () => {
    // Em produção, aqui salvaria as configurações no backend
    localStorage.setItem('system-settings', JSON.stringify(settings));
    toast({
      title: "Configurações salvas",
      description: "Todas as configurações foram atualizadas com sucesso!"
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const sendNotification = async (type: 'voting_start' | 'voting_reminder' | 'voting_end') => {
    if (!activePeriod) {
      toast({
        title: "Erro",
        description: "Não há período de votação ativo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingNotification(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: {
          type,
          month: activePeriod.month
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
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotification(false);
    }
  };

  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
            <p className="text-muted-foreground">
              Gerencie as configurações gerais do sistema de votação SHEQ
            </p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>

        {/* Configurações de Votação */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Período de Votação</CardTitle>
            </div>
            <CardDescription>
              Configure o período mensal em que as votações ficam ativas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Votação Habilitada</Label>
                <p className="text-sm text-muted-foreground">
                  Permite que gestores votem no sistema
                </p>
              </div>
              <Switch
                checked={settings.votingEnabled}
                onCheckedChange={(checked) => updateSetting('votingEnabled', checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDay">Dia de Início</Label>
                <Input
                  id="startDay"
                  type="number"
                  min="1"
                  max="31"
                  value={settings.votingStartDay}
                  onChange={(e) => updateSetting('votingStartDay', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Dia do mês em que a votação abre
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDay">Dia de Encerramento</Label>
                <Input
                  id="endDay"
                  type="number"
                  min="1"
                  max="31"
                  value={settings.votingEndDay}
                  onChange={(e) => updateSetting('votingEndDay', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Dia do mês em que a votação encerra
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Permitir Votação Atrasada</Label>
                <p className="text-sm text-muted-foreground">
                  Permite votos após o prazo oficial (para casos especiais)
                </p>
              </div>
              <Switch
                checked={settings.allowLateVoting}
                onCheckedChange={(checked) => updateSetting('allowLateVoting', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de E-mail */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Notificações por E-mail</CardTitle>
            </div>
            <CardDescription>
              Configure o envio automático de notificações para os gestores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificações Habilitadas</Label>
                <p className="text-sm text-muted-foreground">
                  Envio automático de e-mails sobre votações
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderDays">Dias de Antecedência para Lembrete</Label>
              <Input
                id="reminderDays"
                type="number"
                min="1"
                max="10"
                value={settings.reminderDays}
                onChange={(e) => updateSetting('reminderDays', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Quantos dias antes do prazo final enviar o lembrete
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailTemplate">Template de E-mail</Label>
              <Textarea
                id="emailTemplate"
                rows={6}
                value={settings.emailTemplate}
                onChange={(e) => updateSetting('emailTemplate', e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Use [NOME], [DATA_FIM] e [LINK] como variáveis
              </p>
            </div>

            {/* Envio Manual de Notificações */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base">Envio Manual de Notificações</Label>
              {activePeriod ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      📅 Período ativo: {activePeriod.month}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      De {activePeriod.startDate.toLocaleDateString('pt-BR')} até {activePeriod.endDate.toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      onClick={() => sendNotification('voting_start')}
                      disabled={isLoadingNotification}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Início
                    </Button>
                    <Button
                      onClick={() => sendNotification('voting_reminder')}
                      disabled={isLoadingNotification}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Lembrete
                    </Button>
                    <Button
                      onClick={() => sendNotification('voting_end')}
                      disabled={isLoadingNotification}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Encerramento
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-muted-foreground border rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum período ativo para notificações</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Resultado */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Critérios e Resultados</CardTitle>
            </div>
            <CardDescription>
              Configure como os resultados são calculados e exibidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Critérios de Desempate (em ordem de prioridade)</Label>
              <div className="space-y-2">
                {settings.tieBreakingCriteria.map((criteria, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </span>
                    <span>{criteria}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Exibir Resultados em Tempo Real</Label>
                <p className="text-sm text-muted-foreground">
                  Mostra contagem de votos durante o período de votação
                </p>
              </div>
              <Switch
                checked={settings.showRealTimeResults}
                onCheckedChange={(checked) => updateSetting('showRealTimeResults', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Exigir Todas as Respostas</Label>
                <p className="text-sm text-muted-foreground">
                  Obriga o gestor a responder todas as 8 perguntas SHEQ
                </p>
              </div>
              <Switch
                checked={settings.requireAllAnswers}
                onCheckedChange={(checked) => updateSetting('requireAllAnswers', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações Avançadas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Configurações Avançadas</CardTitle>
            </div>
            <CardDescription>
              Configurações técnicas e de sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Backup e Manutenção</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Execute tarefas de manutenção do sistema
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Exportar Dados
                </Button>
                <Button variant="outline" size="sm">
                  Limpar Cache
                </Button>
                <Button variant="outline" size="sm">
                  Reprocessar Votos
                </Button>
              </div>
            </div>

            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <h4 className="font-medium mb-2 text-destructive">Zona de Perigo</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Ações irreversíveis que afetam todo o sistema
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm">
                  Resetar Votação Atual
                </Button>
                <Button variant="destructive" size="sm">
                  Limpar Histórico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}