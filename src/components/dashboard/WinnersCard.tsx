import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Download, Users, Building } from "lucide-react";
import { MonthlyResult } from "@/types";

interface WinnersCardProps {
  currentResult: MonthlyResult | null;
  month: string;
  onGenerateCertificate: (collaboratorId: string, type: 'funcionario' | 'terceirizado') => void;
}

export function WinnersCard({ currentResult, month, onGenerateCertificate }: WinnersCardProps) {
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (!currentResult) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <CardTitle>Vencedores do Mês</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aguardando finalização da votação</p>
            <p className="text-sm">Os vencedores serão anunciados em breve</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <CardTitle>Vencedores - {formatMonth(month)}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funcionário Vencedor */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-primary">Destaque Funcionário</h4>
          </div>
          
          {currentResult.funcionarioWinner ? (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/10 to-transparent rounded-lg border">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentResult.funcionarioWinner.collaborator.photo} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(currentResult.funcionarioWinner.collaborator.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{currentResult.funcionarioWinner.collaborator.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentResult.funcionarioWinner.collaborator.department}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {currentResult.funcionarioWinner.totalVotes} votos
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {currentResult.funcionarioWinner.totalYesAnswers} pontos SHEQ
                    </Badge>
                    {currentResult.funcionarioWinner.isTieBreaker && (
                      <Badge variant="secondary" className="text-xs">
                        Desempate
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGenerateCertificate(currentResult.funcionarioWinner!.collaborator.id, 'funcionario')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Certificado
              </Button>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground border rounded-lg">
              Nenhum vencedor definido
            </div>
          )}
        </div>

        {/* Terceirizado Vencedor */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-destructive" />
            <h4 className="font-semibold text-destructive">Destaque Terceirizado</h4>
          </div>
          
          {currentResult.terceiroWinner ? (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-destructive/10 to-transparent rounded-lg border">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentResult.terceiroWinner.collaborator.photo} />
                  <AvatarFallback className="bg-destructive text-destructive-foreground">
                    {getInitials(currentResult.terceiroWinner.collaborator.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{currentResult.terceiroWinner.collaborator.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentResult.terceiroWinner.collaborator.company} - {currentResult.terceiroWinner.collaborator.department}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {currentResult.terceiroWinner.totalVotes} votos
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {currentResult.terceiroWinner.totalYesAnswers} pontos SHEQ
                    </Badge>
                    {currentResult.terceiroWinner.isTieBreaker && (
                      <Badge variant="secondary" className="text-xs">
                        Desempate
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGenerateCertificate(currentResult.terceiroWinner!.collaborator.id, 'terceirizado')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Certificado
              </Button>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground border rounded-lg">
              Nenhum vencedor definido
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}