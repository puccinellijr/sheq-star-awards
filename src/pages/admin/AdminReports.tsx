import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, Calendar, Users, Trophy, TrendingUp, Calculator, CheckCircle, Clock, Mail } from "lucide-react";
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

  // Get available months from voting periods (active and finalized)
  const availableMonths = useMemo(() => {
    return votingPeriods
      .filter(period => period.isActive || period.isFinalized)
      .map(period => ({
        value: period.month,
        label: new Date(period.month + '-01').toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        }) + (period.isActive ? ' (Ativo)' : ' (Finalizado)'),
        isActive: period.isActive
      }))
      .sort((a, b) => {
        // Prioritize active period first, then by date
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return b.value.localeCompare(a.value);
      });
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

  // Calculate statistics - Include both admins and gestores as valid voters
  const totalVotantes = useMemo(() => {
    return users.filter(user => user.role === 'gestor' || user.role === 'admin').length;
  }, [users]);

  const votedGestores = useMemo(() => {
    const uniqueVoters = new Set(monthlyVotes.map(vote => vote.voterId));
    return uniqueVoters.size;
  }, [monthlyVotes]);

  const pendingGestores = totalVotantes - votedGestores;
  const participationRate = totalVotantes > 0 ? Math.round((votedGestores / totalVotantes) * 100) : 0;

  // Calculate voting status for each manager - Include both admins and gestores
  const managersVotingStatus = useMemo(() => {
    const votantes = users.filter(user => user.role === 'gestor' || user.role === 'admin');
    const voterIds = new Set(monthlyVotes.map(vote => vote.voterId));
    
    const voted = votantes
      .filter(votante => voterIds.has(votante.id))
      .map(votante => {
        const userVote = monthlyVotes.find(vote => vote.voterId === votante.id);
        return {
          ...votante,
          voteDate: userVote?.createdAt
        };
      })
      .sort((a, b) => new Date(b.voteDate).getTime() - new Date(a.voteDate).getTime());
    
    const pending = votantes
      .filter(votante => !voterIds.has(votante.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return { voted, pending };
  }, [users, monthlyVotes]);

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
  const handleExportPDF = async () => {
    const doc = new jsPDF();
    
    // Convert logo to base64
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    
    try {
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        logoImg.src = '/lovable-uploads/69239e6b-598a-4828-8a9b-2f5f17031fda.png';
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = logoImg.width;
      canvas.height = logoImg.height;
      ctx?.drawImage(logoImg, 0, 0);
      const logoBase64 = canvas.toDataURL('image/png');
      
      // Header with logo and title
      doc.addImage(logoBase64, 'PNG', 20, 15, 40, 20);
      
      // Set colors (Odfjell brand colors)
      const primaryBlue = [30, 58, 138]; // hsl(217 65% 20%)
      const odfjellYellow = [251, 191, 36]; // hsl(47 100% 50%)
      const lightGray = [241, 245, 249]; // hsl(217 12% 95%)
      
      // Title section
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DE VOTAÇÃO', 70, 25);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('DESTAQUE SHEQ', 70, 32);
      
      // Month and date info
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      const currentDate = new Date().toLocaleDateString('pt-BR');
      doc.text(`Gerado em: ${currentDate}`, 140, 40);
      
      // Blue line separator
      doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setLineWidth(2);
      doc.line(20, 45, 190, 45);
      
      // Month section
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(20, 55, 170, 15, 'F');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`MÊS: ${availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth}`, 25, 65);
      
      // Statistics section
      let yPos = 85;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTATÍSTICAS DE PARTICIPAÇÃO', 20, yPos);
      yPos += 10;
      
      // Statistics cards
      doc.setFont('helvetica', 'normal');
      doc.setFillColor(255, 255, 255);
      doc.rect(20, yPos, 40, 25, 'FD');
      doc.rect(65, yPos, 40, 25, 'FD');
      doc.rect(110, yPos, 40, 25, 'FD');
      doc.rect(155, yPos, 35, 25, 'FD');
      
      // Statistics content
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(totalVotantes.toString(), 35, yPos + 10);
      doc.text(votedGestores.toString(), 80, yPos + 10);
      doc.text(pendingGestores.toString(), 125, yPos + 10);
      doc.text(`${participationRate}%`, 167, yPos + 10);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Total Votantes', 25, yPos + 18);
      doc.text('Votaram', 75, yPos + 18);
      doc.text('Pendentes', 115, yPos + 18);
      doc.text('Participação', 160, yPos + 18);
      
      yPos += 40;
      
      // Winners section
      if (winners.funcionario || winners.terceirizado) {
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('VENCEDORES DO MÊS', 20, yPos);
        yPos += 15;
        
        if (winners.funcionario) {
          doc.setFillColor(odfjellYellow[0], odfjellYellow[1], odfjellYellow[2]);
          doc.rect(20, yPos, 170, 12, 'F');
          doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('🏆 FUNCIONÁRIO:', 25, yPos + 8);
          doc.setFont('helvetica', 'normal');
          doc.text(winners.funcionario.name, 75, yPos + 8);
          yPos += 17;
        }
        
        if (winners.terceirizado) {
          doc.setFillColor(odfjellYellow[0], odfjellYellow[1], odfjellYellow[2]);
          doc.rect(20, yPos, 170, 12, 'F');
          doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('🏆 TERCEIRIZADO:', 25, yPos + 8);
          doc.setFont('helvetica', 'normal');
          doc.text(winners.terceirizado.name, 85, yPos + 8);
          yPos += 17;
        }
      }
      
      // Detailed rankings
      yPos += 10;
      if (rankings.funcionarios.length > 0) {
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RANKING FUNCIONÁRIOS', 20, yPos);
        yPos += 10;
        
        // Table header
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(20, yPos, 170, 8, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text('Pos.', 25, yPos + 5);
        doc.text('Nome', 40, yPos + 5);
        doc.text('Votos', 120, yPos + 5);
        doc.text('Sim', 140, yPos + 5);
        doc.text('Taxa', 160, yPos + 5);
        yPos += 8;
        
        // Rankings data
        rankings.funcionarios.slice(0, 10).forEach((funcionario, index) => {
          if (yPos > 250) return; // Page limit
          const rate = funcionario.votes > 0 ? Math.round((funcionario.totalYes / funcionario.votes) * 100) : 0;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
          doc.text(`${index + 1}º`, 25, yPos + 5);
          doc.text(funcionario.name.substring(0, 25), 40, yPos + 5);
          doc.text(funcionario.votes.toString(), 125, yPos + 5);
          doc.text(funcionario.totalYes.toString(), 145, yPos + 5);
          doc.text(`${rate}%`, 165, yPos + 5);
          yPos += 7;
        });
      }
      
      // Footer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('Odfjell Terminals - Granel Química Ltda.', 20, 280);
      doc.text('Terminal Rio Grande', 20, 285);
      doc.text('Sistema DESTAQUE SHEQ', 140, 280);
      doc.text(`Página 1 de 1`, 140, 285);
      
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
      // Fallback: Generate PDF without logo
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DE VOTAÇÃO', 20, 30);
      doc.setFontSize(14);
      doc.text(`Mês: ${availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth}`, 20, 50);
    }
    
    doc.save(`relatorio-destaque-sheq-${selectedMonth}.pdf`);
  };

  const handleExportExcel = () => {
    const data = [
      ['Relatório de Votação'],
      ['Mês', availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth],
      ['Total de Votantes', totalVotantes],
      ['Votantes', votedGestores],
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
              <CardTitle className="text-sm font-medium">Total de Votantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVotantes}</div>
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

        {/* Status de Votação dos Gestores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle>Gestores que Votaram</CardTitle>
              </div>
              <CardDescription>
                {managersVotingStatus.voted.length} de {totalVotantes} votantes já participaram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managersVotingStatus.voted.length > 0 ? (
                  managersVotingStatus.voted.map((gestor) => (
                    <div key={gestor.id} className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{gestor.name}</p>
                          <p className="text-sm text-muted-foreground">{gestor.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="mb-1">Votou</Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(gestor.voteDate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>Nenhum gestor votou ainda neste mês</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-destructive" />
                <CardTitle>Gestores Pendentes</CardTitle>
              </div>
              <CardDescription>
                {managersVotingStatus.pending.length} gestores ainda não votaram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managersVotingStatus.pending.length > 0 ? (
                  managersVotingStatus.pending.map((gestor) => (
                    <div key={gestor.id} className="flex items-center justify-between p-3 border rounded-lg bg-destructive/5">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-destructive" />
                        <div>
                          <p className="font-medium">{gestor.name}</p>
                          <p className="text-sm text-muted-foreground">{gestor.department}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge variant="destructive">Pendente</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{gestor.email}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p>Todos os gestores já votaram!</p>
                    <p className="text-sm">Parabéns pela participação completa!</p>
                  </div>
                )}
              </div>
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
                    const totalVotantesForMonth = users.filter(user => user.role === 'gestor' || user.role === 'admin').length;
                    const monthParticipation = totalVotantesForMonth > 0 ? Math.round((uniqueVoters.size / totalVotantesForMonth) * 100) : 0;
                    
                    return (
                      <div key={month.value} className="p-4 border rounded-lg">
                        <p className="font-semibold">{month.label}</p>
                        <p className="text-2xl font-bold text-primary">{monthParticipation}%</p>
                        <p className="text-sm text-muted-foreground">{uniqueVoters.size}/{totalVotantesForMonth} votantes</p>
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