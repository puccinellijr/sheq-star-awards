import { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { User as AuthUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Auth hook initializing...');
    let isMounted = true;
    
    // Set loading timeout as safety fallback
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('⚠️ Auth loading timeout - forcing loading to false');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 Auth state change:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking auth state change
          setTimeout(async () => {
            if (!isMounted) return;
            
            try {
              console.log('📥 Fetching profile for user:', session.user.id);
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (!isMounted) return;
              
              if (error) {
                console.error('❌ Error fetching profile:', error);
                setUser(null);
              } else if (profile) {
                console.log('✅ Profile found:', profile.email, profile.role);
                setUser({
                  id: profile.user_id,
                  name: profile.name,
                  email: profile.email,
                  role: profile.role as 'admin' | 'gestor',
                  department: profile.department,
                  createdAt: new Date(profile.created_at)
                });
              } else {
                console.log('⚠️ No profile found for user');
                setUser(null);
              }
            } catch (error) {
              console.error('❌ Profile fetch error:', error);
              if (isMounted) setUser(null);
            } finally {
              if (isMounted) {
                console.log('✅ Auth loading complete');
                setIsLoading(false);
                clearTimeout(loadingTimeout);
              }
            }
          }, 0);
        } else {
          console.log('🚪 No session - user logged out');
          setUser(null);
          setIsLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    );

    // Check for existing session after setting up listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      console.log('🔍 Initial session check:', session?.user?.id || 'No session');
      // The onAuthStateChange listener will handle this session
    }).catch((error) => {
      console.error('❌ Error getting initial session:', error);
      if (isMounted) {
        setIsLoading(false);
        clearTimeout(loadingTimeout);
      }
    });

    return () => {
      console.log('🧹 Auth hook cleanup');
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Erro ao fazer login" };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Erro ao criar conta" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, login, signup, logout, isLoading }}>
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