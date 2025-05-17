/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
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
  Assignment as AssignmentIcon,
  StopCircle as ParadosIcon,
  DateRange as PendingIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { collection, query, getDocs, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { diferencaEmDias, formatarData } from './Helpers';
import type { ProcessoCompra } from '../models/ProcessoCompra';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const [processos_totais, setProcessosTotais] = useState(0)
  const [qtd_processos_mais_de_180_dias, setQtdProcessosMaisDe180Dias] = useState(0)
  const [qtd_processos_parados_ha_mais_tempo, setQtdProcessosParadosHaMaisTempo] = useState(0)
  const [lista_processos_mais_antigos, setListaProcessosMaisAntigos] = useState<ProcessoCompra[]>([])

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const processosRef = collection(db, "processos")
        const q = query(processosRef, orderBy("data_primeira_etapa", "asc"))
        const snapShot = await getDocs(q)
        let lista_processos_no_banco: ProcessoCompra[] = []
        let qntProcessosMaisDe180Dias = 0
        let qntProcessosParadosHaMaisDe30Dias = 0
        snapShot.forEach(processo => {
          const processo_tipado: ProcessoCompra = {
            nup: processo.data().nup,
            fonte_recebimento: processo.data().fonte_recebimento,
            objeto: processo.data().objeto,
            quantidade: processo.data().quantidade,
            uopm_beneficiada: processo.data().uopm_beneficiada,
            valor: processo.data().valor,
            data_etapa_mais_recente: processo.data().data_etapa_mais_recente,
            data_primeira_etapa: processo.data().data_primeira_etapa,
            status: processo.data().status
          }
          lista_processos_no_banco.push(processo_tipado)
          let hoje = new Date()
          if(diferencaEmDias(processo.data().data_primeira_etapa, hoje.toISOString())>180) qntProcessosMaisDe180Dias+=1;
          if(diferencaEmDias(processo.data().data_etapa_mais_recente, hoje.toISOString())>30) qntProcessosParadosHaMaisDe30Dias+=1
        })

        setListaProcessosMaisAntigos(lista_processos_no_banco.slice(0, 5))
        const tamanho_da_tabela_processos = await getCountFromServer(processosRef)
        setProcessosTotais(tamanho_da_tabela_processos.data().count)
        setQtdProcessosMaisDe180Dias(qntProcessosMaisDe180Dias)
        setQtdProcessosParadosHaMaisTempo(qntProcessosParadosHaMaisDe30Dias)
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
        Bem-vindo(a) ao SIGECON-PM, {currentUser?.email}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#e3f2fd'
            }}
          >
            <AssignmentIcon sx={{ fontSize: 40, mr: 2, color: '#1565c0' }} />
            <Box>
              <Typography variant="h5">{processos_totais}</Typography>
              <Typography variant="body2" color="text.secondary">Processos Totais</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
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
              <Typography variant="h5">{qtd_processos_mais_de_180_dias}</Typography>
              <Typography variant="body2" color="text.secondary">Processos com mais de 180 dias desde a criação</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#fdecea'
            }}
          >
            <ParadosIcon sx={{ fontSize: 40, mr: 2, color: '#fd5022' }} />
            <Box>
              <Typography variant="h5">{qtd_processos_parados_ha_mais_tempo}</Typography>
              <Typography variant="body2" color="text.secondary">Processos parados há mais de 30 dias</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Lista de processos recentes */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Card elevation={2}>
            <CardHeader
              title="Processos mais antigos"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <CardContent>
              {loading ? (
                <Typography>Carregando...</Typography>
              ) : lista_processos_mais_antigos.length > 0 ? (
                <List>
                  {lista_processos_mais_antigos.map((processo) => (
                    <React.Fragment key={processo.nup}>
                      <ListItem>
                        <ListItemText

                          primary={<React.Fragment>
                            <IconButton
                              size="small"
                              onClick={() => handleVerProcesso(processo.nup)}
                              color="primary"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            {processo.nup} - {processo.objeto};&nbsp;
                            Data da última movimentação:
                            <Typography component="span" variant="body2" sx={{ color: `${decidirCor(processo.data_etapa_mais_recente)}`, display: 'inline', fontWeight: "bold" }}>
                              {formatarData(processo.data_etapa_mais_recente)}
                            </Typography>
                          </React.Fragment>}
                          secondary={
                            <Typography component="span" variant="body2" sx={{ color: 'text.primary', display: 'inline' }}>
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
      </Grid>
    </Box>
  );
};

export default Dashboard;