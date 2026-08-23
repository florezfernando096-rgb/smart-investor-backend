import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, loadStoredSupabaseConfig } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isDemoUser: boolean;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  isDemoUser: false,
  loginAsDemo: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    async function initAuth() {
      await loadStoredSupabaseConfig();

      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (err) {
        console.warn('Error fetching Supabase session:', err);
      } finally {
        setLoading(false);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        if (currentSession) {
          setIsDemoUser(false);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }

    initAuth();
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user && data?.session) {
        setUser(data.user);
        setSession(data.session);
        setIsDemoUser(false);
        return { success: true };
      }

      return { success: false, error: 'No se pudo iniciar sesión' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión con Supabase' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.session) {
        setUser(data.user);
        setSession(data.session);
        setIsDemoUser(false);
        return { success: true };
      }

      return { success: true, error: 'Registro exitoso. Revisa tu correo de confirmación si está habilitado.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión con Supabase' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar si falla la red
    }
    setUser(null);
    setSession(null);
    setIsDemoUser(false);
  };

  const loginAsDemo = () => {
    const mockUser: any = {
      id: 'demo-user-smart-investor-001',
      email: 'demo@smartinvestor.app',
      app_metadata: {},
      user_metadata: { name: 'Inversor Demo' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    setUser(mockUser);
    setIsDemoUser(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isDemoUser,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
