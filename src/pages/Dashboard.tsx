import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { VotingCard } from "@/components/dashboard/VotingCard";
import { WinnersCard } from "@/components/dashboard/WinnersCard";
import { VotingForm } from "@/components/voting/VotingForm";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/hooks/use-toast";
import { LogOut, BarChart3, Users, Settings } from "lucide-react";
import { Collaborator, Vote, VotingPeriod, MonthlyResult } from "@/types";

// Mock data para demonstração
const MOCK_COLLABORATORS: Collaborator[] = [
  {
    id: "1",
    name: "Ezequel Froner",
    department: "SHEQ",
    type: "funcionario",
    createdAt: new Date()
  },
  {
    id: "2",
    name: "Carlos Silva Santos",
    department: "Operações",
    type: "funcionario",
    createdAt: new Date()
  },
  {
    id: "3",
    name: "Jacenir Pacheco Machado",
    department: "Manutenção",
    type: "terceirizado",
    company: "Gocil",
    createdAt: new Date()
  },
  {
    id: "4",
    name: "Roberto Oliveira Lima",
    department: "Segurança",
    type: "terceirizado",
    company: "Securitas",
    createdAt: new Date()
  }
];

const MOCK_VOTING_PERIOD: VotingPeriod = {
  id: "1",
  month: "2024-01",
  startDate: new Date(2024, 0, 1),
  endDate: new Date(2024, 0, 25),
  isActive: true,
  isFinalized: false
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showVotingForm, setShowVotingForm] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentResult, setCurrentResult] = useState<MonthlyResult | null>(null);

  useEffect(() => {
    // Verificar se o usuário já votou neste mês
    const userVote = votes.find(v => 
      v.voterId === user?.id && 
      v.month === MOCK_VOTING_PERIOD.month
    );
    setHasVoted(!!userVote);
  }, [votes, user?.id]);

  const handleVote = (voteData: {
    funcionario: { collaboratorId: string; answers: boolean[] };
    terceirizado: { collaboratorId: string; answers: boolean[] };
  }) => {
    if (!user) return;

    const funcionarioCollab = MOCK_COLLABORATORS.find(c => c.id === voteData.funcionario.collaboratorId);
    const terceiroCollab = MOCK_COLLABORATORS.find(c => c.id === voteData.terceirizado.collaboratorId);

    if (!funcionarioCollab || !terceiroCollab) return;

    const newVotes: Vote[] = [
      {
        id: `vote-${Date.now()}-func`,
        voterId: user.id,
        voterName: user.name,
        collaboratorId: funcionarioCollab.id,
        collaboratorName: funcionarioCollab.name,
        collaboratorType: 'funcionario',
        month: MOCK_VOTING_PERIOD.month,
        answers: voteData.funcionario.answers,
        totalYes: voteData.funcionario.answers.filter(a => a).length,
        createdAt: new Date()
      },
      {
        id: `vote-${Date.now()}-terc`,
        voterId: user.id,
        voterName: user.name,
        collaboratorId: terceiroCollab.id,
        collaboratorName: terceiroCollab.name,
        collaboratorType: 'terceirizado',
        month: MOCK_VOTING_PERIOD.month,
        answers: voteData.terceirizado.answers,
        totalYes: voteData.terceirizado.answers.filter(a => a).length,
        createdAt: new Date()
      }
    ];

    setVotes(prev => [...prev, ...newVotes]);
    setShowVotingForm(false);
    
    toast({
      title: "Voto registrado com sucesso!",
      description: "Obrigado por participar da votação SHEQ deste mês.",
    });
  };

  const handleGenerateCertificate = (collaboratorId: string, type: 'funcionario' | 'terceirizado') => {
    // Em produção, aqui seria gerada uma imagem de certificado
    toast({
      title: "Certificado gerado!",
      description: "O certificado foi gerado e está pronto para download.",
    });
  };

  if (showVotingForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Logo />
            <Button variant="outline" onClick={() => setShowVotingForm(false)}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
        <VotingForm
          collaborators={MOCK_COLLABORATORS}
          onSubmitVote={handleVote}
          onCancel={() => setShowVotingForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.department}</p>
              </div>
              {user?.role === 'admin' && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Usuários
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Relatórios
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Votação */}
          <VotingCard
            isVotingActive={MOCK_VOTING_PERIOD.isActive}
            hasVoted={hasVoted}
            votingPeriod={{
              startDate: MOCK_VOTING_PERIOD.startDate,
              endDate: MOCK_VOTING_PERIOD.endDate
            }}
            onVote={() => setShowVotingForm(true)}
          />

          {/* Vencedores */}
          <WinnersCard
            currentResult={currentResult}
            month={MOCK_VOTING_PERIOD.month}
            onGenerateCertificate={handleGenerateCertificate}
          />
        </div>

        {/* Estatísticas da Votação */}
        {user?.role === 'admin' && votes.length > 0 && (
          <div className="mt-8">
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Estatísticas da Votação Atual</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {votes.filter(v => v.month === MOCK_VOTING_PERIOD.month).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total de Votos</p>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <p className="text-2xl font-bold text-accent-foreground">
                    {new Set(votes.filter(v => v.month === MOCK_VOTING_PERIOD.month).map(v => v.voterId)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Gestores Votaram</p>
                </div>
                <div className="text-center p-4 bg-destructive/5 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">
                    {Math.ceil((new Date(MOCK_VOTING_PERIOD.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-sm text-muted-foreground">Dias Restantes</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}