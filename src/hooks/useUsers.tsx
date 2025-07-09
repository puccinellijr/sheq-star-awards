import { useState, useEffect } from "react";
import { User } from "@/types";

// Mock data inicial (users já existentes do auth)
const INITIAL_USERS: User[] = [
  {
    id: "1",
    name: "Admin Sistema",
    email: "admin@odfjell.com",
    role: "admin",
    department: "TI",
    createdAt: new Date()
  },
  {
    id: "2", 
    name: "José Francisco Avilla Puccinelli Jr.",
    email: "jose.puccinelli@odfjell.com",
    role: "gestor",
    department: "TI e Automação",
    createdAt: new Date()
  },
  {
    id: "3",
    name: "Maria Silva Santos",
    email: "maria.santos@odfjell.com", 
    role: "gestor",
    department: "Operações",
    createdAt: new Date()
  }
];

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const loadUsers = () => {
      const saved = localStorage.getItem('users');
      if (saved) {
        setUsers(JSON.parse(saved));
      } else {
        setUsers(INITIAL_USERS);
        localStorage.setItem('users', JSON.stringify(INITIAL_USERS));
      }
      setIsLoading(false);
    };

    setTimeout(loadUsers, 300);
  }, []);

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('users', JSON.stringify(newUsers));
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    const updated = [...users, newUser];
    saveUsers(updated);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const updated = users.map(u => 
      u.id === id ? { ...u, ...updates } : u
    );
    saveUsers(updated);
  };

  const deleteUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
  };

  const getUsersByRole = (role: 'admin' | 'gestor') => {
    return users.filter(u => u.role === role);
  };

  return {
    users,
    isLoading,
    addUser,
    updateUser,
    deleteUser,
    getUsersByRole
  };
}