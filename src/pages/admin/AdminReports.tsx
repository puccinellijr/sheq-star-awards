import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, Calendar, Users, Trophy, TrendingUp, Calculator } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useResults } from "@/hooks/useResults";
import { useVotes } from "@/hooks/useVotes";
import { useUsers } from "@/hooks/useUsers";
import { useVotingPeriods } from "@/hooks/useVotingPeriods";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export default function AdminReports() {
  const { toast } = useToast();
  const { results, isLoading: resultsLoading, calculateWinners, getResultByMonth } = useResults();
  const { votes, isLoading: votesLoading } = useVotes();
  const { users, isLoading: usersLoading } = useUsers();
  const { periods: votingPeriods, isLoading: periodsLoading } = useVotingPeriods();

  // Get available months from voting periods
  const availableMonths = useMemo(() => {
    return votingPeriods
      .filter(period => period.isFinalized)
      .map(period => ({
        value: period.month,
        label: new Date(period.month + '-01').toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        })
      }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [votingPeriods]);

  // Set default month to the most recent available
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return availableMonths.length > 0 ? availableMonths[0].value : "";
  });

  // Update selected month when available months change
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].value);
    }
  }, [availableMonths, selectedMonth]);

  // Get data for selected month
  const monthlyVotes = useMemo(() => {
    return votes.filter(vote => vote.month === selectedMonth);
  }, [votes, selectedMonth]);

  const monthlyResult = useMemo(() => {
    return getResultByMonth(selectedMonth);
  }, [getResultByMonth, selectedMonth]);

  // Calculate statistics
  const totalGestores = useMemo(() => {
    return users.filter(user => user.role === 'gestor').length;
  }, [users]);

  const votedGestores = useMemo(() => {
    const uniqueVoters = new Set(monthlyVotes.map(vote => vote.voterId));
    return uniqueVoters.size;
  }, [monthlyVotes]);

  const pendingGestores = totalGestores - votedGestores;
  const participationRate = totalGestores > 0 ? Math.round((votedGestores / totalGestores) * 100) : 0;

  // Calculate rankings
  const rankings = useMemo(() => {
    const collaboratorStats = monthlyVotes.reduce((acc, vote) => {
      const key = vote.collaboratorId;
      if (!acc[key]) {
        acc[key] = {
          id: vote.collaboratorId,
          name: vote.collaboratorName,
          type: vote.collaboratorType,
          department: vote.collaboratorName, // This might need to be fixed based on your data structure
          company: vote.collaboratorType === 'terceirizado' ? 'Terceirizado' : undefined,
          votes: 0,
          totalYes: 0
        };
      }
      acc[key].votes += 1;
      acc[key].totalYes += vote.totalYes;
      return acc;
    }, {} as Record<string, any>);

    const allStats = Object.values(collaboratorStats);
    const funcionarios = allStats.filter(stat => stat.type === 'funcionario').sort((a, b) => b.votes - a.votes || b.totalYes - a.totalYes);
    const terceirizados = allStats.filter(stat => stat.type === 'terceirizado').sort((a, b) => b.votes - a.votes || b.totalYes - a.totalYes);

    return { funcionarios, terceirizados };
  }, [monthlyVotes]);

  // Calculate winners
  const winners = useMemo(() => {
    if (monthlyResult) {
      return {
        funcionario: monthlyResult.funcionarioWinner ? {
          name: monthlyResult.funcionarioWinner.collaborator.name,
          department: monthlyResult.funcionarioWinner.collaborator.department,
          votes: monthlyResult.funcionarioWinner.totalVotes,
          totalYes: monthlyResult.funcionarioWinner.totalYesAnswers
        } : rankings.funcionarios[0],
        terceirizado: monthlyResult.terceiroWinner ? {
          name: monthlyResult.terceiroWinner.collaborator.name,
          department: monthlyResult.terceiroWinner.collaborator.department,
          company: monthlyResult.terceiroWinner.collaborator.company,
          votes: monthlyResult.terceiroWinner.totalVotes,
          totalYes: monthlyResult.terceiroWinner.totalYesAnswers
        } : rankings.terceirizados[0]
      };
    }
    return {
      funcionario: rankings.funcionarios[0],
      terceirizado: rankings.terceirizados[0]
    };
  }, [monthlyResult, rankings]);

  // Handle calculate winners
  const handleCalculateWinners = async () => {
    if (!selectedMonth) return;
    
    try {
      await calculateWinners(selectedMonth);
      toast({
        title: "Sucesso",
        description: "Vencedores calculados com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao calcular vencedores.",
        variant: "destructive"
      });
    }
  };

  // Export functions
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Relatório de Votação', 20, 30);
    doc.setFontSize(14);
    doc.text(`Mês: ${availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth}`, 20, 50);
    doc.text(`Total de Gestores: ${totalGestores}`, 20, 70);
    doc.text(`Gestores que Votaram: ${votedGestores}`, 20, 90);
    doc.text(`Taxa de Participação: ${participationRate}%`, 20, 110);
    
    if (winners.funcionario) {
      doc.text(`Vencedor Funcionário: ${winners.funcionario.name}`, 20, 140);
    }
    if (winners.terceirizado) {
      doc.text(`Vencedor Terceirizado: ${winners.terceirizado.name}`, 20, 160);
    }
    
    doc.save(`relatorio-${selectedMonth}.pdf`);
  };

  const handleExportExcel = () => {
    const data = [
      ['Relatório de Votação'],
      ['Mês', availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth],
      ['Total de Gestores', totalGestores],
      ['Gestores que Votaram', votedGestores],
      ['Taxa de Participação', `${participationRate}%`],
      [],
      ['Ranking Funcionários'],
      ['Posição', 'Nome', 'Votos', 'Total Sim'],
      ...rankings.funcionarios.map((f, i) => [i + 1, f.name, f.votes, f.totalYes]),
      [],
      ['Ranking Terceirizados'],
      ['Posição', 'Nome', 'Votos', 'Total Sim'],
      ...rankings.terceirizados.map((t, i) => [i + 1, t.name, t.votes, t.totalYes])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio-${selectedMonth}.xlsx`);
  };

  const isLoading = resultsLoading || votesLoading || usersLoading || periodsLoading;

  if (isLoading) {
    return (
      <AdminLayout title="Relatórios">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Relatórios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Relatórios de Votação</h2>
            <p className="text-muted-foreground">
              Análise detalhada dos resultados e participação
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMonth && !monthlyResult && (
              <Button onClick={handleCalculateWinners} variant="outline">
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Vencedores
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas de Participação */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Gestores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGestores}</div>
              <p className="text-xs text-muted-foreground">elegíveis para votar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participação</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{votedGestores}</div>
              <p className="text-xs text-muted-foreground">gestores votaram</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Calendar className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{pendingGestores}</div>
              <p className="text-xs text-muted-foreground">ainda não votaram</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Participação</CardTitle>
              <BarChart3 className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">{participationRate}%</div>
              <p className="text-xs text-muted-foreground">dos gestores</p>
            </CardContent>
          </Card>
        </div>

        {/* Vencedores do Mês */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle>Destaque Funcionário</CardTitle>
              </div>
              <CardDescription>Vencedor da categoria funcionário</CardDescription>
            </CardHeader>
            <CardContent>
              {winners.funcionario ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">{winners.funcionario.name}</h3>
                  <p className="text-muted-foreground">{winners.funcionario.department}</p>
                  <div className="flex items-center gap-4">
                    <Badge variant="default">
                      {winners.funcionario.votes} votos
                    </Badge>
                    <Badge variant="secondary">
                      {winners.funcionario.totalYes} respostas "Sim"
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum vencedor calculado ainda</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent-foreground" />
                <CardTitle>Destaque Terceirizado</CardTitle>
              </div>
              <CardDescription>Vencedor da categoria terceirizado</CardDescription>
            </CardHeader>
            <CardContent>
              {winners.terceirizado ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">{winners.terceirizado.name}</h3>
                  <p className="text-muted-foreground">
                    {winners.terceirizado.department}{winners.terceirizado.company && ` • ${winners.terceirizado.company}`}
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="default">
                      {winners.terceirizado.votes} votos
                    </Badge>
                    <Badge variant="secondary">
                      {winners.terceirizado.totalYes} respostas "Sim"
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum vencedor calculado ainda</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rankings Detalhados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking - Funcionários</CardTitle>
              <CardDescription>Todos os funcionários por número de votos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankings.funcionarios.length > 0 ? rankings.funcionarios.map((funcionario, index) => (
                  <div key={funcionario.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{funcionario.name}</p>
                        <p className="text-sm text-muted-foreground">{funcionario.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{funcionario.votes} votos</p>
                      <p className="text-sm text-muted-foreground">{funcionario.totalYes} "Sim"</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">Nenhum funcionário votado neste mês</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ranking - Terceirizados</CardTitle>
              <CardDescription>Todos os terceirizados por número de votos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankings.terceirizados.length > 0 ? rankings.terceirizados.map((terceirizado, index) => (
                  <div key={terceirizado.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-accent-foreground">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{terceirizado.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {terceirizado.department}{terceirizado.company && ` • ${terceirizado.company}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{terceirizado.votes} votos</p>
                      <p className="text-sm text-muted-foreground">{terceirizado.totalYes} "Sim"</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">Nenhum terceirizado votado neste mês</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Participação</CardTitle>
            <CardDescription>Taxa de participação dos últimos meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableMonths.length > 0 ? (
                <div className={`grid grid-cols-1 ${availableMonths.length >= 2 ? 'md:grid-cols-2' : ''} ${availableMonths.length >= 4 ? 'lg:grid-cols-4' : ''} gap-4 text-center`}>
                  {availableMonths.slice(0, 4).map((month) => {
                    const monthVotes = votes.filter(vote => vote.month === month.value);
                    const uniqueVoters = new Set(monthVotes.map(vote => vote.voterId));
                    const monthParticipation = totalGestores > 0 ? Math.round((uniqueVoters.size / totalGestores) * 100) : 0;
                    
                    return (
                      <div key={month.value} className="p-4 border rounded-lg">
                        <p className="font-semibold">{month.label}</p>
                        <p className="text-2xl font-bold text-primary">{monthParticipation}%</p>
                        <p className="text-sm text-muted-foreground">{uniqueVoters.size}/{totalGestores} gestores</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum período de votação finalizado encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}