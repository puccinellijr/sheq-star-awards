import { useState, useEffect } from "react";
import { Collaborator } from "@/types";

// Mock data inicial
const INITIAL_COLLABORATORS: Collaborator[] = [
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

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const loadCollaborators = () => {
      const saved = localStorage.getItem('collaborators');
      if (saved) {
        setCollaborators(JSON.parse(saved));
      } else {
        setCollaborators(INITIAL_COLLABORATORS);
        localStorage.setItem('collaborators', JSON.stringify(INITIAL_COLLABORATORS));
      }
      setIsLoading(false);
    };

    setTimeout(loadCollaborators, 300);
  }, []);

  const saveCollaborators = (newCollaborators: Collaborator[]) => {
    setCollaborators(newCollaborators);
    localStorage.setItem('collaborators', JSON.stringify(newCollaborators));
  };

  const addCollaborator = (collaborator: Omit<Collaborator, 'id' | 'createdAt'>) => {
    const newCollaborator: Collaborator = {
      ...collaborator,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    const updated = [...collaborators, newCollaborator];
    saveCollaborators(updated);
    return newCollaborator;
  };

  const updateCollaborator = (id: string, updates: Partial<Collaborator>) => {
    const updated = collaborators.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    saveCollaborators(updated);
  };

  const deleteCollaborator = (id: string) => {
    const updated = collaborators.filter(c => c.id !== id);
    saveCollaborators(updated);
  };

  const getCollaboratorsByType = (type: 'funcionario' | 'terceirizado') => {
    return collaborators.filter(c => c.type === type);
  };

  return {
    collaborators,
    isLoading,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    getCollaboratorsByType
  };
}