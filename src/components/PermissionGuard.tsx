import React from 'react';
import { Permission, hasPermission } from '../utils/accessControl';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Componente que exibe conteúdo apenas se o usuário tiver a permissão necessária
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { userRole } = useAuth();
  
  if (hasPermission(userRole, permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

export default PermissionGuard;