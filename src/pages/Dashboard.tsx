import React, { useEffect, useState } from 'react';
import { auth, db} from '../config/firebase';
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
  Button
} from '@mui/material';
import { 
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon, 
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { collection, query, where, doc, getDoc, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface ProcessoCompra {
  nup: string,
  fonte_recebimento: string,
  objeto: string,
  quantidade: number,
  uopm_beneficiada: string,
  valor: number
}

const Dashboard: React.FC = () => {
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
        const snapShot = await getDocs(processosRef)
        let lista_processos_no_banco: ProcessoCompra[] = []
        snapShot.forEach(processo =>{
          const processo_tipado: ProcessoCompra = {
            nup: processo.data().nup,
            fonte_recebimento: processo.data().fonte_recebimento,
            objeto: processo.data().objeto,
            quantidade: processo.data().quantidade,
            uopm_beneficiada: processo.data().uopm_beneficiada,
            valor: processo.data().valor
          }
          lista_processos_no_banco.push(processo_tipado)
        })

        setProcessos(lista_processos_no_banco)
        setProcessosTotais(lista_processos_no_banco.length)
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Função auxiliar para formatar datas
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

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
              <Typography variant="body2" color="text.secondary">Processos muito atrasados</Typography>
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
              <Typography variant="body2" color="text.secondary">Processos Concluídos</Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Lista de processos recentes */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={2}>
            <CardHeader 
              title="Processos Recentes" 
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
                          primary={`${processo.nup} - ${processo.objeto}`}
                          secondary={`Status: ${processo.fonte_recebimento} | Valor: ${processo.valor}`}
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