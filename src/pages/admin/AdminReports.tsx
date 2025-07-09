import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, Calendar, Users, Trophy, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function AdminReports() {
  const [selectedMonth, setSelectedMonth] = useState("2024-01");

  // Mock data para demonstração
  const mockData = {
    votingStats: {
      totalVoters: 15,
      votedCount: 12,
      pendingCount: 3,
      participationRate: 80
    },
    winners: {
      funcionario: {
        name: "Ezequel Froner",
        department: "SHEQ",
        votes: 8,
        totalYes: 64
      },
      terceirizado: {
        name: "Jacenir Pacheco Machado",
        department: "Manutenção",
        company: "Gocil",
        votes: 7,
        totalYes: 58
      }
    },
    rankings: {
      funcionarios: [
        { name: "Ezequel Froner", department: "SHEQ", votes: 8, totalYes: 64 },
        { name: "Carlos Silva Santos", department: "Operações", votes: 4, totalYes: 30 }
      ],
      terceirizados: [
        { name: "Jacenir Pacheco Machado", department: "Manutenção", company: "Gocil", votes: 7, totalYes: 58 },
        { name: "Roberto Oliveira Lima", department: "Segurança", company: "Securitas", votes: 5, totalYes: 38 }
      ]
    }
  };

  const handleExportPDF = () => {
    // Em produção, aqui seria implementada a exportação em PDF
    alert("Funcionalidade de exportação em PDF será implementada");
  };

  const handleExportExcel = () => {
    // Em produção, aqui seria implementada a exportação em Excel
    alert("Funcionalidade de exportação em Excel será implementada");
  };

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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">Janeiro 2024</SelectItem>
                <SelectItem value="2023-12">Dezembro 2023</SelectItem>
                <SelectItem value="2023-11">Novembro 2023</SelectItem>
              </SelectContent>
            </Select>
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
              <div className="text-2xl font-bold">{mockData.votingStats.totalVoters}</div>
              <p className="text-xs text-muted-foreground">elegíveis para votar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participação</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{mockData.votingStats.votedCount}</div>
              <p className="text-xs text-muted-foreground">gestores votaram</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Calendar className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{mockData.votingStats.pendingCount}</div>
              <p className="text-xs text-muted-foreground">ainda não votaram</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Participação</CardTitle>
              <BarChart3 className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">{mockData.votingStats.participationRate}%</div>
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
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{mockData.winners.funcionario.name}</h3>
                <p className="text-muted-foreground">{mockData.winners.funcionario.department}</p>
                <div className="flex items-center gap-4">
                  <Badge variant="default">
                    {mockData.winners.funcionario.votes} votos
                  </Badge>
                  <Badge variant="secondary">
                    {mockData.winners.funcionario.totalYes}/64 respostas "Sim"
                  </Badge>
                </div>
              </div>
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
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{mockData.winners.terceirizado.name}</h3>
                <p className="text-muted-foreground">
                  {mockData.winners.terceirizado.department} • {mockData.winners.terceirizado.company}
                </p>
                <div className="flex items-center gap-4">
                  <Badge variant="default">
                    {mockData.winners.terceirizado.votes} votos
                  </Badge>
                  <Badge variant="secondary">
                    {mockData.winners.terceirizado.totalYes}/56 respostas "Sim"
                  </Badge>
                </div>
              </div>
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
                {mockData.rankings.funcionarios.map((funcionario, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
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
                ))}
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
                {mockData.rankings.terceirizados.map((terceirizado, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-accent-foreground">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{terceirizado.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {terceirizado.department} • {terceirizado.company}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{terceirizado.votes} votos</p>
                      <p className="text-sm text-muted-foreground">{terceirizado.totalYes} "Sim"</p>
                    </div>
                  </div>
                ))}
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
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-4 border rounded-lg">
                  <p className="font-semibold">Janeiro 2024</p>
                  <p className="text-2xl font-bold text-primary">80%</p>
                  <p className="text-sm text-muted-foreground">12/15 gestores</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-semibold">Dezembro 2023</p>
                  <p className="text-2xl font-bold">87%</p>
                  <p className="text-sm text-muted-foreground">13/15 gestores</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-semibold">Novembro 2023</p>
                  <p className="text-2xl font-bold">73%</p>
                  <p className="text-sm text-muted-foreground">11/15 gestores</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-semibold">Outubro 2023</p>
                  <p className="text-2xl font-bold">93%</p>
                  <p className="text-sm text-muted-foreground">14/15 gestores</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}