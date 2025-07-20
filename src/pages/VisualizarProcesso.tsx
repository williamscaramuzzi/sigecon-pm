/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VisualizarProcesso.css'
import {
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Autocomplete
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatarValor, formatarData, diferencaEmDias, decidirCorChip } from './Helpers';
import { listalocais } from './listalocais';
import type { ProcessoCompra } from '../models/ProcessoCompra';
import type { EtapaProcesso } from '../models/EtapaProcesso';


const VisualizarProcesso: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  // Estados para os dados do processo
  const [processo, setProcesso] = useState<ProcessoCompra | null>(null);
  const [etapas, setEtapas] = useState<EtapaProcesso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [idEtapaEditando, setIdEtapaEditando] = useState("")
  const [editValues, setEditValues] = useState<ProcessoCompra | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddEtapa, setShowAddEtapa] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [currentEditingEtapa, setCurrentEditingEtapa] = useState<Omit<EtapaProcesso, 'id'>>({
    nup: processo?.nup,
    data: "",
    status: '',
    local: ''
  });
  const [novaEtapa, setNovaEtapa] = useState<Omit<EtapaProcesso, 'id'>>({
    nup: processo?.nup,
    data: new Date().toISOString().slice(0, 10),
    status: '',
    local: ''
  });

  const [modalEmpenhoOpen, setModalEmpenhoOpen] = useState(false);
  const [numeroEmpenho, setNumeroEmpenho] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');

  //Dados para o gráfico
  const [dadosgrafico1, setDadosGrafico1] = useState<{ local: string, num_dias: number }[]>([{ local: 'Setor 1', num_dias: 5 }]);
  const [dadosgrafico2, setDadosGrafico2] = useState<{ local: string, num_dias: number }[]>([{ local: 'Setor 1', num_dias: 5 }]);

  // Buscar dados do processo
  const fetchProcessoData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Buscar dados do processo
      const processoDoc = await getDoc(doc(db, "processos", id));

      if (processoDoc.exists()) {
        const processoData = { ...processoDoc.data() } as ProcessoCompra;
        setProcesso(processoData);
        setEditValues(processoData);

        // Buscar etapas do processo
        const etapasQuery = query(
          collection(db, "etapas"),
          where("nup", "==", processoData.nup)
        );

        const etapasSnapshot = await getDocs(etapasQuery);
        const etapasList = etapasSnapshot.docs.map(doc => ({
          ...doc.data()
        })) as EtapaProcesso[];

        // Ordenar etapas por data (mais recente primeiro)
        const sortedEtapas = etapasList.sort(
          (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
        );

        setEtapas(sortedEtapas);
        setNovaEtapa(prev => {
          return {
            ...prev,
            nup: processoData.nup
          }
        })

        const resultado = sortedEtapas.map((etapa, index) => {
          const dataAtual = new Date(etapa.data);
          let dataReferencia: Date;

          if (index === 0) {
            // Para a primeira etapa, compara com hoje
            dataReferencia = new Date();
          } else {
            // Para as demais, compara com a etapa anterior
            dataReferencia = new Date(sortedEtapas[index - 1].data);
          }

          const diferencaMs = dataReferencia.getTime() - dataAtual.getTime();
          const num_dias = Math.ceil(diferencaMs / (1000 * 60 * 60 * 24)); // Arredonda para cima

          return {
            local: etapa.local,
            num_dias: num_dias >= 0 ? num_dias : 0,  // Garante que não fique negativo se ocorrer erro
          };
        });
        setDadosGrafico1(resultado);
        const dadosAgrupados: { local: string; num_dias: number; }[] = Object.values(
          resultado.reduce((acc: any, cur) => {
            if (!acc[cur.local]) {
              acc[cur.local] = { local: cur.local, num_dias: 0 };
            }
            acc[cur.local].num_dias += cur.num_dias;
            return acc;
          }, {})

        );
        setDadosGrafico2(dadosAgrupados);

      } else {
        setError("Processo não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do processo:", error);
      setError("Erro ao carregar o processo");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando o componente montar
  useEffect(() => {
    fetchProcessoData();
    //O código abaixo fica escutando a variável idEtapaEditando. Se existe uma etapa sendo editada atualmente, trigga o useeffect.
    //E aí o useEffect seta a currentEditingEtapa como etapa
    if (idEtapaEditando) {
      const etapaToEdit = etapas.find(etapa => (`${etapa.nup}_${etapa.data}`) === idEtapaEditando);
      if (etapaToEdit) {
        setCurrentEditingEtapa({ ...etapaToEdit });
      }
    } else {
      setCurrentEditingEtapa({
        nup: processo?.nup,
        data: "",
        status: '',
        local: ''
      });

    }
  }, [id, idEtapaEditando]);

  // Iniciar edição de um campo
  const handleEditField = (field: keyof ProcessoCompra) => {
    setEditMode(prev => ({ ...prev, [field]: true }));
  };

  // Cancelar edição
  const handleCancelEdit = (field: keyof ProcessoCompra) => {
    setEditMode(prev => ({ ...prev, [field]: false }));
    if (processo) {
      setEditValues(processo);
    }
  };

  // Atualizar valor em edição
  const handleChangeField = (field: keyof ProcessoCompra, value: any) => {
    if (editValues) {
      setEditValues({
        ...editValues,
        [field]: value
      });
    }
  };

  // Salvar campo editado
  const handleSaveField = async (field: keyof ProcessoCompra) => {
    if (!processo || !editValues || !processo.nup) return;

    setSaveLoading(true);
    try {
      //o id é o nup
      const processoRef = doc(db, "processos", processo.nup);

      // Apenas atualizar o campo específico
      await updateDoc(processoRef, {
        [field]: editValues[field]
      });

      // Atualizar estado local
      setProcesso({
        ...processo,
        [field]: editValues[field]
      });

      // Sair do modo de edição
      setEditMode(prev => ({ ...prev, [field]: false }));
    } catch (error) {
      console.error(`Erro ao atualizar ${field}:`, error);
      setError(`Erro ao salvar: ${error}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Renderizar campo editável ou somente leitura
  const renderField = (label: string, field: keyof ProcessoCompra, value: any, type: 'text' | 'number' = 'text') => {
    const isEditing = editMode[field];

    // Formatar valor para exibição
    let displayValue = value;
    if (field === 'valor') {
      displayValue = formatarValor(value);
    }

    return (
      <Grid size={{ xs: 12, md: 6 }} >
        <Box sx={{ position: 'relative' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>

          {isEditing ? (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                type={type}
                value={editValues?.[field] || ''}
                onChange={(e) => handleChangeField(field, type === 'number' ? Number(e.target.value) : e.target.value)}
                slotProps={{
                  input: field === 'valor' ? <Box component="span" sx={{ mr: 1 }}>R$</Box> : undefined,
                }}
              />
              <Box sx={{ ml: 1 }}>
                <IconButton
                  color="primary"
                  onClick={() => handleSaveField(field)}
                  disabled={saveLoading}
                >
                  <SaveIcon fontSize="small" />
                </IconButton>
                <IconButton
                  color="inherit"
                  onClick={() => handleCancelEdit(field)}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                borderRadius: 1,
                position: 'relative',
                '&:hover': userRole === 'gerente' ? {
                  bgcolor: 'action.hover',
                  '& .edit-icon': {
                    opacity: 1
                  }
                } : {}
              }}
            >
              {field === 'objeto' ? (
                <Typography variant="h6">{displayValue}</Typography>
              ) : field === 'status' ? (
                <Chip
                  label={displayValue}
                  size="medium"
                  color={"default"}
                />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: field === 'nup' ? 'bold' : 'normal' }}>
                  {displayValue}
                </Typography>
              )}

              {userRole === 'gerente' && (
                <IconButton
                  className="edit-icon"
                  size="small"
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }}
                  onClick={() => handleEditField(field)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
      </Grid>
    );
  };

  async function handleExcluirProcesso(e: any) {
    if (!processo || !editValues || !processo.nup) return;
    if (confirm("Tem certeza que deseja deletar o processo?")) {
      setSaveLoading(true);
      try {
        //o id é o nup
        const processoRef = doc(db, "processos", processo.nup);

        // Exclui o processo
        await deleteDoc(processoRef)

        //Procura todas as etapas e exclui também
        const etapasRef = collection(db, "etapas")
        const q = query(etapasRef, where("nup", "==", processo.nup))
        const listaEtapasDoProcessoExcluido = await getDocs(q)
        listaEtapasDoProcessoExcluido.forEach(async (etapa) => {
          await deleteDoc(doc(db, "etapas", etapa.id))
        })
        setSnackbarMessage('Processo excluído com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        navigate("/consultar_processos?page=1&rows=-1")
      } catch (error) {
        console.error(`Erro ao deletar processo`)
      } finally {
        setSaveLoading(false);
      }
    }

  }

  // Função para fechar o modal e limpar os campos
  const handleCloseModalEmpenho = () => {
    setModalEmpenhoOpen(false);
    setNumeroEmpenho('');
    setPrazoEntrega('');
  };

  const handleEmpenhar = async () => {
    if (!numeroEmpenho || !prazoEntrega) return;

    try {
      //copiar processo para tabela de concluidos
      const novoDoc = doc(db, "contratos_empenhados", processo!.nup)
      await setDoc(novoDoc, { ...processo, num_empenho: numeroEmpenho, prazo_entrega: prazoEntrega })

      //tratar as etapas do processo
      etapas.forEach(async (currentEtapa) => {
        //copia cada etapa para a tabela de etapas concluidas
        const etapaconcluida = doc(db, "contratos_empenhados_etapas", `${currentEtapa.nup}_${currentEtapa.data}`)
        await setDoc(etapaconcluida, currentEtapa)

        //deleta cada etapa da tabela etapas normal
        const etapaADeletar = doc(db, "etapas", `${currentEtapa.nup}_${currentEtapa.data}`)
        await deleteDoc(etapaADeletar)

      })

      //finalmente deleta o processo da tabela processos, pois agora ele está empenhado 
      const processoRef = doc(db, "processos", processo!.nup);
      await deleteDoc(processoRef)

      setSnackbarMessage('Processo empenhado com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      navigate('/consultar_contratos_empenhados?page=1&rows=-1')

    } catch (error) {
      console.log(error)
    }

    // Após implementar a lógica, fechar o modal
    handleCloseModalEmpenho();
  };

  async function handleAbrirModalEmpenhar(e: any) {
    if (!processo || !editValues || !processo.nup) return;
    setModalEmpenhoOpen(true);

  }

  async function handleConcluirProcesso(e: any) {
    if (!processo || !editValues || !processo.nup) return;
    const confirmou = confirm(`Tem certeza que deseja concluir o Processo ${processo.nup}?`)
    if (confirmou) {
      try {
        //copiar processo para tabela de concluidos
        const novoDoc = doc(db, "z_processos_concluidos", processo.nup)
        await setDoc(novoDoc, processo)

        //tratar as etapas do processo
        etapas.forEach(async (currentEtapa) => {
          //copia cada etapa para a tabela de etapas concluidas
          const etapaconcluida = doc(db, "z_processos_concluidos_etapas", `${currentEtapa.nup}_${currentEtapa.data}`)
          await setDoc(etapaconcluida, currentEtapa)

          //deleta cada etapa da tabela etapas normal
          const etapaADeletar = doc(db, "etapas", `${currentEtapa.nup}_${currentEtapa.data}`)
          await deleteDoc(etapaADeletar)

        })

        //finalmente deleta o processo da tabela processos, pois agora ele está concluido 
        const processoRef = doc(db, "processos", processo!.nup);
        await deleteDoc(processoRef)

        setSnackbarMessage('Processo arquivado com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        navigate('/consultar_processos_arquivados?page=1&rows=-1')

      } catch (error) {
        console.log(error)
      }
    }
  }

  const handleNovaEtapaChange = (field: keyof Omit<EtapaProcesso, 'id'>, value: string) => {
    setNovaEtapa(prev => ({
      ...prev,
      [field]: value
    }));
  };


  async function adicionarEtapa(etapa: EtapaProcesso) {
    // Crie um ID único para o documento conforme chave cadastrada no firebase: nup_data. Exemplo: 31.000.000-2025_2025-12-31 . Repare que a data é formato ISO para facilitar ordenação.
    const docId = `${etapa.nup}_${etapa.data}`;
    //padrao do doc é banco de dados, tabela, e indice unico
    const novaEtapaRef = doc(db, "etapas", docId)
    await setDoc(novaEtapaRef, etapa)

    //Agora atualiza dois campos que são do PROCESSO: o status e a data da ultima etapa. Sim, atributos estão presentes em Processo e em Etapa por necessidade sempre 
    // de ter a etapa mais recente no objeto Processo
    const esseProcessoRef = doc(db, "processos", processo!.nup)
    //E se o gerente estiver adicionando uma etapa anterior, mais antiga que a atual? Logo, para esse caso, temos que fazer um if
    // para atualizar Status e Data_etapa_mais_recente somente se estas forem as mais atuais
    if (etapa.data > processo!.data_etapa_mais_recente) {
      await updateDoc(esseProcessoRef, { status: etapa.status, data_etapa_mais_recente: etapa.data })
    }
  }

  async function salvarEtapaEditada() {
    //primeiro deleta a etapa antiga
    const etapaRef = doc(db, "etapas", idEtapaEditando);
    await deleteDoc(etapaRef)

    //depois adiciona a nova

    await adicionarEtapa(currentEditingEtapa)
  }


  function renderEtapasRows(etapas: EtapaProcesso[], label: string, field: keyof ProcessoCompra, value: any, type: 'text' | 'number' = 'text') {
    return (
      etapas.map(etapa => {
        //Se a etapa que eu to renderizando agora, for a etapa que está sendo editada, renderizar campos input para edição.
        //Se for uma etapa que NÃO está sendo editada, renderizar campos tablecell normais
        if ((`${etapa.nup}_${etapa.data}`) === idEtapaEditando) {
          return (
            <TableRow key={`${etapa.nup}_${etapa.data}`}>
              <TableCell>
                <TextField variant="outlined" fullWidth label="Data" type="date"
                  value={currentEditingEtapa.data}
                  onChange={(e) => {
                    setCurrentEditingEtapa(prev => ({ ...prev, data: e.target.value }))

                  }}
                />
              </TableCell>
              <TableCell>
                <Autocomplete
                  fullWidth
                  options={listalocais}
                  value={currentEditingEtapa.local}
                  onChange={(event, newValue) => {
                    setCurrentEditingEtapa(prev => ({ ...prev, local: newValue }))
                  }}
                  disableClearable
                  freeSolo={false}
                  renderInput={(params) => (
                    <TextField {...params} label="Local" />
                  )}
                />
              </TableCell>
              <TableCell>
                <TextField variant="outlined"
                  value={currentEditingEtapa.status}
                  onChange={(e) => {
                    setCurrentEditingEtapa(prev => ({ ...prev, status: e.target.value }))
                  }}

                />
              </TableCell>
              <TableCell>
                <IconButton color='primary'
                  onClick={() => {
                    salvarEtapaEditada()
                    setIdEtapaEditando("")
                  }}>
                  <SaveIcon />
                </IconButton>
              </TableCell>
              <TableCell>
                <IconButton color='primary'
                  onClick={() => {
                    setIdEtapaEditando("")
                  }}>
                  <CancelIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          )
        } else {
          return (
            <TableRow key={`${etapa.nup}_${etapa.data}`} sx={{
              mt: 1,
              p: 1,
              borderRadius: 1,
              position: 'relative',
              '&:hover': userRole === 'gerente' ? {
                bgcolor: 'action.hover',
                '& .edit-icon': {
                  opacity: 1
                }
              } : {}
            }}>
              <TableCell>{formatarData(etapa.data)}</TableCell>
              <TableCell>{etapa.local}</TableCell>
              <TableCell>
                {etapa.status}
                {userRole === 'gerente' && (
                  <IconButton
                    className="edit-icon"
                    size="small"
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                    onClick={(e) => {
                      setIdEtapaEditando(`${etapa.nup}_${etapa.data}`)
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>

          )
        }
      })
    )

  }

  const CustomTick = (props: any) => {
    //Esse elemento só serve para formatarmos a legenda dos gráficos e quebrar um nome de setor se for muito grande, tipo SUPLANTEC
    const { x, y, payload } = props;
    const texto = payload.value;
    const limite = 8; // Limite de caracteres antes de "abaixar" o texto

    const deslocamento = texto.length > limite ? 20 : 0; // Aumenta a distância vertical se for grande

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16 + deslocamento} // dy controla o deslocamento vertical
          textAnchor="middle"
          fill="#1976d2"
          fontSize="1.4vw"
          fontWeight="bold"
        >
          {texto}
        </text>
      </g>
    );
  };






  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !processo) {
    return (
      <Box>
        <Alert severity="error">{error || "Processo não encontrado"}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/consultar_processos?page=1&rows=-1')}
          sx={{ mt: 2 }}
        >
          Voltar para lista
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '@media print': { display: 'none' } }}>
        <Typography variant="h4" component="h1">
          Visualização de Processo
        </Typography>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/consultar_processos?page=1&rows=-1')}
        >
          Voltar
        </Button>
      </Box>

      {/* Dados principais do processo */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardHeader
          title={`Processo: ${processo.nup}`}
          slotProps={{ title: { variant: 'h6' } }}
          subheader={processo.status && (
            <Chip
              label={processo.status}
              size="small"
              color={decidirCorChip(processo.data_etapa_mais_recente) as any}
              sx={{ mt: 1 }}
            />

          )}
          action={
            processo.data_etapa_mais_recente && (
              <Grid size={{ xs: 12, md: 6 }} sx={{ py: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                  Data primeira etapa: {formatarData(processo.data_primeira_etapa)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                  Última atualização: {formatarData(processo.data_etapa_mais_recente)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                  Tempo decorrido: {diferencaEmDias(processo.data_primeira_etapa, processo.data_etapa_mais_recente)} dias
                </Typography>
              </Grid>
            )
          }

        />

        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {<Grid size={{ xs: 12, md: 6 }} sx={{ py: 1 }}>
              <Box sx={{ position: 'relative' }}>
                <Typography variant="subtitle2" color="text.primary">
                  {"NUP"}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {processo.nup}
                </Typography>
              </Box>
            </Grid>}
            {renderField("Número do proc. SGC", "num_sgc", processo.num_sgc)}
            {renderField("Fonte de Recebimento", "fonte_recebimento", processo.fonte_recebimento)}
            {renderField("UOPM Beneficiada", "uopm_beneficiada", processo.uopm_beneficiada)}
            {renderField("Valor", "valor", processo.valor, "number")}
            {renderField("Quantidade", "quantidade", processo.quantidade, "number")}
            {renderField("Categoria", "categoria", processo.categoria)}
            {renderField("Objeto", "objeto", processo.objeto)}


            {userRole === "gerente" ? (
              <Grid container size={{ xs: 12, md: 12 }} spacing={1} sx={{ '@media print': { display: 'none' } }}>
                <Grid size={{ xs: 10, md: 3 }}>
                  <Button variant="outlined" color="secondary" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => { handleAbrirModalEmpenhar(e) }}>
                    Empenhar processo
                    <ArrowForwardIcon />
                  </Button>
                </Grid>

                <Grid size={{ xs: 10, md: 3 }}>
                  <Button variant="outlined" color="secondary" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => { handleConcluirProcesso(e) }}>
                    Arquivar processo
                    <ArchiveIcon />
                  </Button>
                </Grid>

                <Grid size={{ xs: 10, md: 3 }}>
                  <Button variant="outlined" color="error" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => { handleExcluirProcesso(e) }}>
                    Excluir processo
                    <DeleteIcon />
                  </Button>
                </Grid>

                <Dialog
                  open={modalEmpenhoOpen}
                  onClose={handleCloseModalEmpenho}
                  maxWidth="sm"
                  fullWidth
                >
                  <DialogTitle>
                    Empenhar Processo
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                      Informe os dados do empenho para o processo {processo?.nup}
                    </DialogContentText>

                    <TextField
                      autoFocus
                      margin="dense"
                      label="Número do Empenho"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={numeroEmpenho}
                      onChange={(e) => setNumeroEmpenho(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      margin="dense"
                      label="Prazo de Entrega"
                      type="date"
                      fullWidth
                      variant="outlined"
                      value={prazoEntrega}
                      onChange={(e) => setPrazoEntrega(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={handleCloseModalEmpenho}
                      color="secondary"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleEmpenhar}
                      variant="contained"
                      color="primary"
                      disabled={!numeroEmpenho.trim() || !prazoEntrega}
                    >
                      Empenhar
                    </Button>
                  </DialogActions>
                </Dialog>
              </Grid>

            ) : (<></>)}
          </Grid>
        </CardContent>
      </Card>

      {/* Etapas do processo */}
      <Card elevation={2}>
        <CardHeader
          title="Etapas do Processo"
          slotProps={{ title: { variant: 'h6' } }}
          subheader={userRole === 'gerente' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!showAddEtapa ? (
                <Typography
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={() => setShowAddEtapa(true)}
                >
                  Adicionar Etapa
                  <EditIcon sx={{ ml: 1, fontSize: 'small' }} />
                </Typography>
              ) : (
                <Box sx={{ width: '100%' }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }} >
                      <TextField
                        fullWidth
                        label="Data"
                        type="date"
                        value={novaEtapa.data}
                        onChange={(e) => handleNovaEtapaChange('data', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} >
                      <Autocomplete
                        fullWidth
                        options={listalocais}
                        value={novaEtapa.local}
                        onChange={(event, newValue) => {
                          handleNovaEtapaChange('local', newValue)
                        }}
                        disableClearable
                        freeSolo={false}
                        renderInput={(params) => (
                          <TextField {...params} label="Local" />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} >
                      <TextField
                        fullWidth
                        label="Status"
                        value={novaEtapa.status}
                        onChange={(e) => handleNovaEtapaChange('status', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        color="primary"
                        onClick={async () => {
                          await adicionarEtapa(novaEtapa)
                          await fetchProcessoData()
                          //reseta fields e deixa nova etapa em seu estágio inicial:
                          setShowAddEtapa(false);
                          setNovaEtapa({
                            nup: processo!.nup,
                            data: new Date().toISOString().slice(0, 10),
                            status: '',
                            local: ''
                          });
                        }}
                      >
                        <SaveIcon />
                      </IconButton>
                      {/* ícone cancelar abaixo, show add etapa fica false e zera a variável nova etapa */}
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          setShowAddEtapa(false);
                          // Reset the new stage fields
                          setNovaEtapa({
                            nup: processo!.nup,
                            data: new Date().toISOString().slice(0, 10),
                            status: '',
                            local: ''
                          });
                        }}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          ) : null}
        />
        <Divider />
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Local</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {etapas.length > 0 ? (
                  renderEtapasRows(etapas, "label", "nup", "valor", "text")
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhuma etapa registrada para este processo
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Feedback para o usuário */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Card
        sx={{
          width: '100%',
          elevation: 2,
          mt: 3,
          '@media print': {
            breakBefore: 'page',
            pageBreakBefore: 'always',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
          },
        }}
      >
        <CardHeader
          title="Tempo por Setor"
          subheader="Demora, em dias, em cada setor"
          sx={{
            '@media print': {
              breakInside: 'avoid',
              pageBreakInside: 'avoid',
            }
          }}
        />
        <CardContent sx={{
          height: 'auto',
          overflow: 'visible',
          '@media print': {
            height: 'auto !important',
            overflow: 'visible !important',
            paddingBottom: '20px !important',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
          },
        }}>
          <Grid container spacing={2} sx={{
            width: "100%", '@media print': {
              breakInside: 'avoid',
              pageBreakInside: 'avoid',
            },
          }} >
            <Grid id='grid_grafico_1' size={{ xs: 12, md: 6 }} >
              <Typography variant="subtitle1" color="black">
                Etapas sequenciais
              </Typography>
              <ResponsiveContainer width="100%" aspect={2}>
                <BarChart data={dadosgrafico1} margin={{ top: 20, right: 30, left: 0, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="local" tick={<CustomTick />} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload; // o objeto completo do ponto do gráfico
                        return (
                          <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: 10 }}>
                            <p><strong>{data.local}</strong></p>
                            <p>{`Nº de dias: ${data.num_dias}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="num_dias" fill="#1976d2">
                    <LabelList
                      dataKey="num_dias"
                      position="top"
                      formatter={(value: any) => `${value} dias`}
                      style={{ fill: '#1976d2', fontSize: "110%", fontWeight: 'bold' }}
                    />

                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Grid>
            <Grid id='grid_grafico_2' size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" color="black">
                Etapas agrupadas
              </Typography>
              <ResponsiveContainer width="100%" aspect={2}>
                <BarChart data={dadosgrafico2} margin={{ top: 20, right: 30, left: 0, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="local" tick={<CustomTick />} />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: any) => {
                    return [value, 'Nº de dias'];
                  }} />
                  <Bar dataKey="num_dias" fill="#1976d2" >
                    <LabelList
                      dataKey="num_dias"
                      position="top"
                      formatter={(value: any) => `${value} dias`}
                      style={{ fill: '#1976d2', fontSize: "110%", fontWeight: 'bold' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

    </Box>
  );
};

export default VisualizarProcesso;