import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import CadastrarProcesso from '../pages/CadastrarProcessos';
import ConsultarProcessos from '../pages/ConsultarProcessos';
import VisualizarProcesso from '../pages/VisualizarProcesso';
import CadastrarContratosEmpenhados from '../pages/CadastrarContratosEmpenhados';
import ConsultarContratosEmpenhados from '../pages/ConsultarContratosEmpenhados';
import Desenvolvimento from '../pages/Desenvolvimento';


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
          path: 'desenvolvimento',
          element: <Desenvolvimento />,
        },
        {
          path: 'dashboard',
          element: <Dashboard />,
        },
        {
          path: 'cadastrar_processos',
          element: <CadastrarProcesso />,
        },
        {
          path: 'cadastrar_contratos_empenhados',
          element: <CadastrarContratosEmpenhados />,
        },
        {
          path: 'consultar_contratos_empenhados',
          element: <ConsultarContratosEmpenhados />,
        },
        {
          path: 'consultar_processos',
          element: <ConsultarProcessos />,
        },
        {
          path: '/processo/:id',
          element: <VisualizarProcesso />,
        },
      ]
    },
    {
      path: '*',
      element: <Navigate to="/dashboard" replace />
    }
  ]);
};

export default AppRoutes;