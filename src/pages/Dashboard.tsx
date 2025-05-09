/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import {db} from '../config/firebase';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton
} from '@mui/material';
import { 
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon, 
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { collection, query, getDocs, orderBy, limit, getCountFromServer} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProcessoCompra {
  id?: string;
  nup: string;
  fonte_recebimento: string;
  objeto: string;
  quantidade: number;
  uopm_beneficiada: string;
  valor: number;
  data_etapa_mais_recente: string,
  status: string
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const [processos_totais, setProcessosTotais] = useState(0)
  const [processos_atrasados, setProcessosAtrasados] = useState(0)
  const [processos_concluidos, setProcessosConcluidos] = useState(0)
  const [processos, setProcessos] = useState<ProcessoCompra[]>([])
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const processosRef = collection(db, "processos")
        const q = query(processosRef, orderBy("data_etapa_mais_recente", "asc"), limit(5))
        const snapShot = await getDocs(q)
        let lista_processos_no_banco: ProcessoCompra[] = []
        snapShot.forEach(processo =>{
          const processo_tipado: ProcessoCompra = {
            nup: processo.data().nup,
            fonte_recebimento: processo.data().fonte_recebimento,
            objeto: processo.data().objeto,
            quantidade: processo.data().quantidade,
            uopm_beneficiada: processo.data().uopm_beneficiada,
            valor: processo.data().valor,
            data_etapa_mais_recente: processo.data().data_etapa_mais_recente,
            status: processo.data().status
          }
          lista_processos_no_banco.push(processo_tipado)
        })

        setProcessos(lista_processos_no_banco)
        const tamanho_da_tabela_processos = await getCountFromServer(processosRef)
        setProcessosTotais(tamanho_da_tabela_processos.data().count)
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

   // Função para ver detalhes do processo
  const handleVerProcesso = (id: string) => {
    navigate(`/processo/${id}`);
  };

  // Formatar data
  const formatarData = (data: string) => {
    if (!data) return '';
    try {
      const date = new Date(data);
      return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch (e) {
      return data;
    }
  };
function decidirCor(data: string): string {
  const dataInformada = new Date(data);
  const hoje = new Date();

  // Zera a hora para comparar só as datas (sem horas)
  dataInformada.setHours(0, 0, 0, 0);
  hoje.setHours(0, 0, 0, 0);

  const diffMs = hoje.getTime() - dataInformada.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias > 30) return 'red';
  if (diffDias > 15) return 'orange';
  return 'green';
}
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        Bem-vindo(a) ao SIGECOM-PM, {currentUser?.email}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: '#e3f2fd' 
            }}
          >
            <ShoppingCartIcon sx={{ fontSize: 40, mr: 2, color: '#1565c0' }} />
            <Box>
              <Typography variant="h5">{processos_totais}</Typography>
              <Typography variant="body2" color="text.secondary">Processos Totais</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: '#fff8e1' 
            }}
          >
            <PendingIcon sx={{ fontSize: 40, mr: 2, color: '#ff9800' }} />
            <Box>
              <Typography variant="h5">{processos_atrasados}</Typography>
              <Typography variant="body2" color="text.secondary">Processos muito atrasados (FALTA IMPLEMENTAR)</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: '#e8f5e9' 
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 40, mr: 2, color: '#2e7d32' }} />
            <Box>
              <Typography variant="h5">{processos_concluidos}</Typography>
              <Typography variant="body2" color="text.secondary">Processos Concluídos (FALTA IMPLEMENTAR)</Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Lista de processos recentes */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={2}>
            <CardHeader 
              title="Processos mais atrasados" 
              titleTypographyProps={{ variant: 'h6' }} 
            />
            <Divider />
            <CardContent>
              {loading ? (
                <Typography>Carregando...</Typography>
              ) : processos.length > 0 ? (
                <List>
                  {processos.map((processo) => (
                    <React.Fragment key={processo.nup}>
                      <ListItem>
                        <ListItemText 
                          primary={<React.Fragment>
                            <IconButton 
                                size="small" 
                                onClick={() => handleVerProcesso(processo.id || processo.nup)}
                                color="primary"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            {processo.nup} - {processo.objeto}&nbsp;
                            <Typography component="span"variant="body2"sx={{ color: `${decidirCor(processo.data_etapa_mais_recente)}`, display: 'inline', fontWeight: "bold" }}>
                                {formatarData(processo.data_etapa_mais_recente)}
                            </Typography>

                          </React.Fragment>}
                          secondary={
                            <Typography component="span"variant="body2"sx={{ color: 'text.primary', display: 'inline' }}>
                            Status: {processo.status} |  Valor: {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(processo.valor)}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography>Nenhum processo encontrado.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Notificações */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardHeader 
              title="Notificações" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<NotificationsIcon />}
            />
            <Divider />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Processo 2023-012 foi atualizado"
                    secondary="Há 2 horas (EXEMPLO)"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Novo processo criado: 2023-015"
                    secondary="Hoje às 09:45 (EXEMPLO)"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Processo 2023-010 concluído"
                    secondary="Ontem às 14:30 (EXEMPLO)"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;