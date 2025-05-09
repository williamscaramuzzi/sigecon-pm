// src/utils/accessControl.ts
import { type UserRole } from '../contexts/AuthContext';

// Funções de verificação de permissão
export const hasAccess = (userRole: UserRole | null, requiredRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
};

// Tipos de permissões/ações
export const Permission = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_PROCESSES: 'view_processes',
  CREATE_PROCESS: 'create_process',
  EDIT_PROCESS: 'edit_process',
  DELETE_PROCESS: 'delete_process',
  MANAGE_USERS: 'manage_users',
  ACCESS_SETTINGS: 'access_settings',
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

// Mapeamento de perfis para permissões
export const rolePermissions: Record<UserRole, Permission[]> = {
  gerente: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROCESSES,
    Permission.CREATE_PROCESS,
    Permission.EDIT_PROCESS,
    Permission.DELETE_PROCESS,
    Permission.MANAGE_USERS,
    Permission.ACCESS_SETTINGS,
  ],
  usuario: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROCESSES,
  ],
};

// Verifica se o usuário tem permissão específica
export const hasPermission = (userRole: UserRole | null, permission: Permission): boolean => {
  if (!userRole) return false;
  return rolePermissions[userRole].includes(permission);
};

// Componente auxiliar para esconder elementos baseado em permissão
export const canPerformAction = (userRole: UserRole | null, action: Permission): boolean => {
  return hasPermission(userRole, action);
};