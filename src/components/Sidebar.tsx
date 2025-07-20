// src/components/Sidebar.tsx
import React from 'react';
import { 
  Drawer, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box, 
  Typography
} from '@mui/material';
import { 
  FindInPage as FindInPageIcon,
  PostAdd as PostAddIcon,
  Dashboard as DashboardIcon,
  AddCircleOutline as AddIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  Source as SourceIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import policiaLogo from '../assets/logopmms.svg'; // Use o mesmo logo da tela de login

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { isGerente } = useAuth();
  const navigate = useNavigate();
  
  const navigateTo = (path: string) => {
    navigate(path);
    onClose();
  };
  
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 2,
        }}
      >
        <Box 
          component="img"
          src={policiaLogo}
          alt="Polícia Militar"
          sx={{ height: 60, mb: 1 }}
        />
        <Typography variant="subtitle1" fontWeight="bold">
          SIGECON-PM
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        <ListItemButton onClick={() => navigateTo('/dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
                
        <ListItemButton onClick={() => navigateTo('/consultar_processos?page=1&rows=-1')}>
          <ListItemIcon>
            <SearchIcon />
          </ListItemIcon>
          <ListItemText primary="Consultar processos em andamento" />
        </ListItemButton>

        <ListItemButton onClick={() => navigateTo('/consultar_contratos_empenhados')}>
              <ListItemIcon>
                <FindInPageIcon/>
              </ListItemIcon>
              <ListItemText primary="Consultar processos com empenho" />
            </ListItemButton>
        
        {isGerente() && (
          <>
            <Divider />
            <ListItemButton onClick={() => navigateTo('/cadastrar_processos')}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="Novo Processo" />
            </ListItemButton>
            
            <ListItemButton onClick={() => navigateTo('/cadastrar_contratos_empenhados')}>
              <ListItemIcon>
                <PostAddIcon/>
              </ListItemIcon>
              <ListItemText primary="Cadastrar Empenhos" />
            </ListItemButton>

            <ListItemButton onClick={() => navigateTo('/relatorio_geral')}>
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="Relatório Geral" />
            </ListItemButton>

            <Divider />
            <ListItemButton onClick={() => navigateTo('/consultar_processos_arquivados?page=1&rows=-1')}>
              <ListItemIcon>
                <SourceIcon />
              </ListItemIcon>
              <ListItemText primary="Processos Arquivados" />
            </ListItemButton>

            
          </>
        )}
      </List>
    </Drawer>
  );
};
export {Sidebar}