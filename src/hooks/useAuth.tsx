import { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users para demonstração
const MOCK_USERS: User[] = [
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("auth-user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    const foundUser = MOCK_USERS.find(u => u.email === email);
    
    if (foundUser && password === "123456") {
      setUser(foundUser);
      localStorage.setItem("auth-user", JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth-user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}