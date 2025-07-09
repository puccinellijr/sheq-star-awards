export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gestor';
  department?: string;
  createdAt: Date;
}

export interface Collaborator {
  id: string;
  name: string;
  department: string;
  type: 'funcionario' | 'terceirizado';
  company?: string; // Para terceirizados
  photo?: string;
  createdAt: Date;
}

export interface Vote {
  id: string;
  voterId: string;
  voterName: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorType: 'funcionario' | 'terceirizado';
  month: string; // Format: "2024-01"
  answers: boolean[]; // 8 perguntas SHEQ
  totalYes: number;
  createdAt: Date;
}

export interface VotingPeriod {
  id: string;
  month: string; // Format: "2024-01"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isFinalized: boolean;
}

export interface MonthlyResult {
  month: string;
  funcionarioWinner?: {
    collaborator: Collaborator;
    totalVotes: number;
    totalYesAnswers: number;
    isTieBreaker: boolean;
  };
  terceiroWinner?: {
    collaborator: Collaborator;
    totalVotes: number;
    totalYesAnswers: number;
    isTieBreaker: boolean;
  };
}

export interface SHEQQuestion {
  id: number;
  question: string;
}

export const SHEQ_QUESTIONS: SHEQQuestion[] = [
  { id: 1, question: "Executa suas atividades priorizando o trabalho seguro?" },
  { id: 2, question: "Interage com as Lideranças e Segurança do Trabalho sobre possíveis melhorias ou riscos existentes?" },
  { id: 3, question: "Utiliza adequadamente todos os EPIs indicados para as atividades?" },
  { id: 4, question: "Orienta de forma respeitosa seus colegas e terceiros no que diz respeito a segurança?" },
  { id: 5, question: "É proativo nas atividades e interage com ações de segurança, saúde e meio ambiente?" },
  { id: 6, question: "Realiza adequadamente o descarte dos resíduos gerados nas atividades?" },
  { id: 7, question: "Mantém seu local de trabalho limpo e organizado?" },
  { id: 8, question: "Não apresentou desvio de procedimentos de segurança neste mês?" }
];