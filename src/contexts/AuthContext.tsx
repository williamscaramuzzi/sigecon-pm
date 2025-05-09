// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Define os tipos de usuário
export type UserRole = 'gerente' | 'usuario';

// Interface para o usuário com informações adicionais
export interface UserWithRole extends User {
  role?: UserRole;
}

// Interface para o contexto de autenticação
interface AuthContextType {
  currentUser: UserWithRole | null;
  userRole: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isGerente: () => boolean;
}

// Cria o contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Props para o provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider que encapsula a aplicação
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserWithRole | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar o papel do usuário no Firestore
  const fetchUserRole = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'tabela_usuarios', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.perfil as UserRole);
        // Adiciona o papel ao objeto de usuário
        (user as UserWithRole).role = userData.role as UserRole;
      } else {
        console.error('Usuário não encontrado no Firestore');
        setUserRole(null);
      }
    } catch (error) {
      console.error('Erro ao buscar o papel do usuário:', error);
      setUserRole(null);
    }
  };

  // Efeito para monitorar mudanças de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserRole(user);
        setCurrentUser(user as UserWithRole);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Função de login
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user
      await fetchUserRole(user);
      setCurrentUser(user as UserWithRole);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  };

  // Verifica se o usuário é gerente
  const isGerente = () => {
    return userRole === 'gerente';
  };

  const value: AuthContextType = {
    currentUser,
    userRole,
    loading,
    login,
    logout,
    isGerente
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Carregando...</div>}
    </AuthContext.Provider>
  );
};