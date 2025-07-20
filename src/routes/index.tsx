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
import NovoUsuario from '../pages/NovoUsuario';
import ResetarSenha from '../pages/ResetarSenha';
import VisualizarContratoEmpenhado from '../pages/VisualizarContratoEmpenhado';
import RelatorioGeral from '../pages/RelatorioGeral';
import ConsultarProcessosArquivados from '../pages/ConsultarProcessosArquivados';
import VisualizarProcessoArquivado from '../pages/VisualizarProcessoArquivado';


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
      path: '/novo_usuario',
      element: <NovoUsuario />
    },
    {
      path: '/resetar_senha',
      element: <ResetarSenha />
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
          path: 'relatorio_geral',
          element: <RelatorioGeral />,
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
          path: 'consultar_processos_arquivados',
          element: <ConsultarProcessosArquivados />,
        },
        {
          path: '/processo/:id',
          element: <VisualizarProcesso />,
        },
        {
          path: '/contrato_empenhado/:id',
          element: <VisualizarContratoEmpenhado />,
        },
        {
          path: '/processo_arquivado/:id',
          element: <VisualizarProcessoArquivado />,
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