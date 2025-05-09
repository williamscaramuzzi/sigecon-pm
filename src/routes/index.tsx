// src/routes/index.tsx
import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import CadastrarProcesso from '../pages/CadastrarProcessos';

// Componente de páginas em branco para serem implementadas posteriormente
const NotImplemented: React.FC<{ pageName: string }> = ({ pageName }) => (
  <div>
    <h2>{pageName}</h2>
    <p>Esta página está em desenvolvimento e será implementada em breve.</p>
  </div>
);

// Rotas protegidas que requerem autenticação
const ProtectedRoute: React.FC<{ children: React.ReactNode, requiresManager?: boolean }> = ({ 
  children,
  requiresManager = false
}) => {
  const { currentUser, isGerente, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (requiresManager && !isGerente()) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

// Componente de rotas
const AppRoutes: React.FC = () => {
  return useRoutes([
    {
      path: '/',
      element: <Navigate to="/dashboard" replace />
    },
    {
      path: '/login',
      element: <Login />
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: 'dashboard',
          element: <Dashboard />,
        },
        {
          path: 'cadastrar_processos',
          element: <CadastrarProcesso />,
        }
      ]
    },
    {
      path: '*',
      element: <Navigate to="/dashboard" replace />
    }
  ]);
};

export default AppRoutes;