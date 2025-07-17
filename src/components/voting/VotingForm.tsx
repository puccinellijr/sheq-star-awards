import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SHEQ_QUESTIONS, Collaborator } from "@/types";
import { Search, Users, Building, CheckCircle, XCircle } from "lucide-react";

interface VotingFormProps {
  collaborators: Collaborator[];
  onSubmitVote: (votes: {
    funcionario: { collaboratorId: string; answers: boolean[] };
    terceirizado: { collaboratorId: string; answers: boolean[] };
  }) => void;
  onCancel: () => void;
}

export function VotingForm({ collaborators, onSubmitVote, onCancel }: VotingFormProps) {
  const [funcionarioSearch, setFuncionarioSearch] = useState("");
  const [terceiroSearch, setTerceiroSearch] = useState("");
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("");
  const [selectedTerceiro, setSelectedTerceiro] = useState<string>("");
  const [funcionarioAnswers, setFuncionarioAnswers] = useState<boolean[]>(new Array(8).fill(false));
  const [terceiroAnswers, setTerceiroAnswers] = useState<boolean[]>(new Array(8).fill(false));
  const { toast } = useToast();

  const funcionarios = collaborators.filter(c => c.type === 'funcionario');
  const terceirizados = collaborators.filter(c => c.type === 'terceirizado');

  const filteredFuncionarios = funcionarios.filter(f => 
    f.name.toLowerCase().includes(funcionarioSearch.toLowerCase()) ||
    f.department.toLowerCase().includes(funcionarioSearch.toLowerCase())
  );

  const filteredTerceirizados = terceirizados.filter(t => 
    t.name.toLowerCase().includes(terceiroSearch.toLowerCase()) ||
    t.department.toLowerCase().includes(terceiroSearch.toLowerCase()) ||
    (t.company && t.company.toLowerCase().includes(terceiroSearch.toLowerCase()))
  );

  const handleFuncionarioAnswer = (questionIndex: number, answer: boolean) => {
    const newAnswers = [...funcionarioAnswers];
    newAnswers[questionIndex] = answer;
    setFuncionarioAnswers(newAnswers);
  };

  const handleTerceiroAnswer = (questionIndex: number, answer: boolean) => {
    const newAnswers = [...terceiroAnswers];
    newAnswers[questionIndex] = answer;
    setTerceiroAnswers(newAnswers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFuncionario || !selectedTerceiro) {
      toast({
        variant: "destructive",
        title: "Seleção incompleta",
        description: "Por favor, selecione um funcionário e um terceirizado."
      });
      return;
    }

    // Verificar se todas as perguntas foram respondidas para funcionário
    const funcionarioIncomplete = funcionarioAnswers.some(answer => answer === null || answer === undefined);
    if (funcionarioIncomplete) {
      toast({
        variant: "destructive",
        title: "Avaliação incompleta",
        description: "Por favor, responda todas as 8 perguntas sobre o funcionário selecionado."
      });
      return;
    }

    // Verificar se todas as perguntas foram respondidas para terceirizado
    const terceiroIncomplete = terceiroAnswers.some(answer => answer === null || answer === undefined);
    if (terceiroIncomplete) {
      toast({
        variant: "destructive",
        title: "Avaliação incompleta",
        description: "Por favor, responda todas as 8 perguntas sobre o terceirizado selecionado."
      });
      return;
    }

    if (selectedFuncionario === selectedTerceiro) {
      toast({
        variant: "destructive",
        title: "Seleção inválida",
        description: "Você não pode votar na mesma pessoa para funcionário e terceirizado."
      });
      return;
    }

    onSubmitVote({
      funcionario: {
        collaboratorId: selectedFuncionario,
        answers: funcionarioAnswers
      },
      terceirizado: {
        collaboratorId: selectedTerceiro,
        answers: terceiroAnswers
      }
    });
  };

  const renderCollaboratorCard = (collaborator: Collaborator, isSelected: boolean, onSelect: () => void) => (
    <div
      key={collaborator.id}
      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full border-2 ${
          isSelected ? 'bg-primary border-primary' : 'border-border'
        }`} />
        <div className="flex-1">
          <p className="font-medium">{collaborator.name}</p>
          <p className="text-sm text-muted-foreground">
            {collaborator.department}
            {collaborator.company && ` - ${collaborator.company}`}
          </p>
        </div>
      </div>
    </div>
  );

  const renderQuestions = (answers: boolean[], onChange: (index: number, answer: boolean) => void) => (
    <div className="space-y-4">
      {SHEQ_QUESTIONS.map((question, index) => (
        <div key={question.id} className="space-y-2">
          <Label className="text-sm font-medium">
            {question.id}. {question.question}
          </Label>
          <RadioGroup
            value={answers[index]?.toString() || ""}
            onValueChange={(value) => onChange(index, value === "true")}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`q${question.id}-yes`} />
              <Label htmlFor={`q${question.id}-yes`} className="flex items-center gap-1 text-green-700">
                <CheckCircle className="h-4 w-4" />
                Sim
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`q${question.id}-no`} />
              <Label htmlFor={`q${question.id}-no`} className="flex items-center gap-1 text-red-700">
                <XCircle className="h-4 w-4" />
                Não
              </Label>
            </div>
          </RadioGroup>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-primary">Votação Destaque SHEQ</h1>
        <p className="text-muted-foreground">
          Selecione um funcionário e um terceirizado que se destacaram em SHEQ este mês
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção Funcionários */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Destaque Funcionário</CardTitle>
            </div>
            <CardDescription>
              Selecione um funcionário interno que se destacou em SHEQ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário por nome ou departamento..."
                value={funcionarioSearch}
                onChange={(e) => setFuncionarioSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredFuncionarios.map(funcionario => 
                renderCollaboratorCard(
                  funcionario,
                  selectedFuncionario === funcionario.id,
                  () => setSelectedFuncionario(funcionario.id)
                )
              )}
            </div>

            {selectedFuncionario && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-4">Avaliação SHEQ - Funcionário</h4>
                {renderQuestions(funcionarioAnswers, handleFuncionarioAnswer)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção Terceirizados */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-destructive" />
              <CardTitle>Destaque Terceirizado</CardTitle>
            </div>
            <CardDescription>
              Selecione um funcionário terceirizado que se destacou em SHEQ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar terceirizado por nome, empresa ou departamento..."
                value={terceiroSearch}
                onChange={(e) => setTerceiroSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredTerceirizados.map(terceiro => 
                renderCollaboratorCard(
                  terceiro,
                  selectedTerceiro === terceiro.id,
                  () => setSelectedTerceiro(terceiro.id)
                )
              )}
            </div>

            {selectedTerceiro && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-4">Avaliação SHEQ - Terceirizado</h4>
                {renderQuestions(terceiroAnswers, handleTerceiroAnswer)}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" size="lg">
            Confirmar Votos
          </Button>
        </div>
      </form>
    </div>
  );
}