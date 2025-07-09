import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Vote } from "lucide-react";

interface VotingCardProps {
  isVotingActive: boolean;
  hasVoted: boolean;
  votingPeriod: {
    startDate: Date;
    endDate: Date;
  } | null;
  onVote: () => void;
}

export function VotingCard({ isVotingActive, hasVoted, votingPeriod, onVote }: VotingCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!votingPeriod || !isVotingActive) return 0;
    const today = new Date();
    const diffTime = votingPeriod.endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Votação do Mês</CardTitle>
          </div>
          <Badge variant={isVotingActive ? "default" : "secondary"}>
            {isVotingActive ? "Ativa" : "Inativa"}
          </Badge>
        </div>
        <CardDescription>
          {isVotingActive 
            ? "Período de votação está aberto. Vote nos destaques SHEQ do mês!"
            : "Aguarde o próximo período de votação."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {votingPeriod && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(votingPeriod.startDate)} até {formatDate(votingPeriod.endDate)}
              </span>
            </div>
            {isVotingActive && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {daysRemaining > 0 
                    ? `${daysRemaining} dias restantes` 
                    : "Último dia!"
                  }
                </span>
              </div>
            )}
          </div>
        )}

        {hasVoted && isVotingActive && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✓ Você já votou neste mês
            </p>
            <p className="text-xs text-green-600 mt-1">
              Obrigado por participar! Aguarde os resultados.
            </p>
          </div>
        )}

        <Button 
          onClick={onVote}
          disabled={!isVotingActive || hasVoted}
          className="w-full"
          size="lg"
        >
          {hasVoted 
            ? "Voto já enviado" 
            : isVotingActive 
              ? "Votar Agora" 
              : "Votação Indisponível"
          }
        </Button>
      </CardContent>
    </Card>
  );
}