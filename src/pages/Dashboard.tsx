import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useVotes } from "@/hooks/useVotes";
import { useVotingPeriods } from "@/hooks/useVotingPeriods";
import { useResults } from "@/hooks/useResults";
import { useCertificateGenerator } from "@/hooks/useCertificateGenerator";
import { VotingCard } from "@/components/dashboard/VotingCard";
import { WinnersCard } from "@/components/dashboard/WinnersCard";
import { VotingForm } from "@/components/voting/VotingForm";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { Vote, MonthlyResult } from "@/types";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { collaborators } = useCollaborators();
  const { votes, submitVote, reload: reloadVotes } = useVotes();
  const { getActivePeriod } = useVotingPeriods();
  const { getResultByMonth, reload: reloadResults } = useResults();
  const { generateCertificate } = useCertificateGenerator();
  const [showVotingForm, setShowVotingForm] = useState(false);
  
  const activePeriod = getActivePeriod();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const votingMonth = activePeriod?.month || currentMonth;
  const currentResult = getResultByMonth(votingMonth);
  
  // Check if user has voted this month by looking for any vote from user in the active period
  const hasVoted = user && activePeriod ? 
    votes.some(v => 
      v.voterId === user.id && 
      v.month === activePeriod.month
    ) : false;

  // Get votes only for the current voting period/month
  const currentVotes = votes.filter(v => v.month === votingMonth);
  const uniqueVotersCount = new Set(currentVotes.map(v => v.voterId)).size;

  // Only show statistics if there are actual votes for the current period AND period is active
  const shouldShowStatistics = currentVotes.length > 0 && activePeriod && activePeriod.isActive;

  // Only show winners if there are results AND votes for the current period AND period is active
  const shouldShowWinners = currentResult && currentVotes.length > 0 && activePeriod && activePeriod.isActive;

  // Calculate days remaining
  const daysRemaining = activePeriod ? 
    Math.max(0, Math.ceil((activePeriod.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  const handleVote = async (voteData: {
    funcionario: { collaboratorId: string; answers: boolean[] };
    terceirizado: { collaboratorId: string; answers: boolean[] };
  }) => {
    if (!user || !activePeriod) return;

    const funcionarioCollab = collaborators.find(c => c.id === voteData.funcionario.collaboratorId);
    const terceiroCollab = collaborators.find(c => c.id === voteData.terceirizado.collaboratorId);

    if (!funcionarioCollab || !terceiroCollab) return;

    try {
      // Submit votes for both funcionario and terceirizado
      const funcionarioVote = await submitVote({
        voterId: user.id,
        voterName: user.name,
        collaboratorId: funcionarioCollab.id,
        collaboratorName: funcionarioCollab.name,
        collaboratorType: 'funcionario',
        month: activePeriod.month,
        answers: voteData.funcionario.answers,
        totalYes: voteData.funcionario.answers.filter(a => a).length
      });

      const terceiroVote = await submitVote({
        voterId: user.id,
        voterName: user.name,
        collaboratorId: terceiroCollab.id,
        collaboratorName: terceiroCollab.name,
        collaboratorType: 'terceirizado',
        month: activePeriod.month,
        answers: voteData.terceirizado.answers,
        totalYes: voteData.terceirizado.answers.filter(a => a).length
      });

      if (funcionarioVote && terceiroVote) {
        setShowVotingForm(false);
        toast({
          title: "Voto registrado com sucesso!",
          description: "Obrigado por participar da votação SHEQ deste mês.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao registrar voto",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCertificate = (collaboratorId: string, type: 'funcionario' | 'terceirizado') => {
    const month = activePeriod?.month || currentMonth;
    generateCertificate(collaboratorId, type, month);
  };

  // Refresh data when component mounts, voting period changes, or when reset event occurs
  useEffect(() => {
    reloadVotes();
    reloadResults();
  }, [activePeriod?.month]);

  // Listen for voting data reset events
  useEffect(() => {
    const handleVotingDataReset = () => {
      console.log('Voting data reset event received, reloading data...');
      reloadVotes();
      reloadResults();
    };

    window.addEventListener('votingDataReset', handleVotingDataReset);
    return () => window.removeEventListener('votingDataReset', handleVotingDataReset);
  }, [reloadVotes, reloadResults]);

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
          collaborators={collaborators}
          onSubmitVote={handleVote}
          onCancel={() => setShowVotingForm(false)}
        />
      </div>
    );
  }

  // Use AdminLayout for consistent navigation for admins
  if (user?.role === 'admin') {
    return (
      <AdminLayout title="Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Votação */}
            <VotingCard
              isVotingActive={activePeriod?.isActive || false}
              hasVoted={hasVoted}
              votingPeriod={{
                startDate: activePeriod?.startDate || new Date(),
                endDate: activePeriod?.endDate || new Date()
              }}
              onVote={() => setShowVotingForm(true)}
            />

            {/* Vencedores - only show if there are valid results, votes, and active period */}
            <WinnersCard
              currentResult={shouldShowWinners ? currentResult : null}
              month={votingMonth}
              onGenerateCertificate={handleGenerateCertificate}
            />
          </div>

          {/* Estatísticas da Votação - only show if there are votes for current period and period is active */}
          {shouldShowStatistics && (
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Estatísticas da Votação Atual</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {currentVotes.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total de Votos</p>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <p className="text-2xl font-bold text-accent-foreground">
                    {uniqueVotersCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Gestores Votaram</p>
                </div>
                <div className="text-center p-4 bg-destructive/5 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">
                    {daysRemaining}
                  </p>
                  <p className="text-sm text-muted-foreground">Dias Restantes</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  // Regular dashboard for gestores
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
            isVotingActive={activePeriod?.isActive || false}
            hasVoted={hasVoted}
            votingPeriod={{
              startDate: activePeriod?.startDate || new Date(),
              endDate: activePeriod?.endDate || new Date()
            }}
            onVote={() => setShowVotingForm(true)}
          />

          {/* Vencedores - only show if there are valid results, votes, and active period */}
          <WinnersCard
            currentResult={shouldShowWinners ? currentResult : null}
            month={votingMonth}
            onGenerateCertificate={handleGenerateCertificate}
          />
        </div>
      </main>
    </div>
  );
}
