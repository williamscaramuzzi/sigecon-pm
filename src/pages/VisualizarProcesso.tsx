/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
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
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

// Interface para os dados do processo
interface ProcessoCompra {
  id?: string;
  nup: string;
  fonte_recebimento: string;
  objeto: string;
  quantidade: number;
  uopm_beneficiada: string;
  valor: number;
  data_etapa_mais_recente: string;
  status: string;
}

// Interface para as etapas do processo
interface EtapaProcesso {
  id?: string;
  nup: string;
  data: string;
  status: string;
}

const VisualizarProcesso: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Simulação do perfil de usuário - Em produção, isso viria do contexto de autenticação
  // Altere para 'gerente' ou 'usuario' para testar diferentes comportamentos
  const [userProfile, setUserProfile] = useState<'gerente' | 'usuario'>('usuario');
  
  // Estados para os dados do processo
  const [processo, setProcesso] = useState<ProcessoCompra | null>(null);
  const [etapas, setEtapas] = useState<EtapaProcesso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<ProcessoCompra | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Buscar dados do processo
  const fetchProcessoData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Buscar dados do processo
      const processoDoc = await getDoc(doc(db, "processos", id));
      
      if (processoDoc.exists()) {
        const processoData = { id: processoDoc.id, ...processoDoc.data() } as ProcessoCompra;
        setProcesso(processoData);
        setEditValues(processoData);
        
        // Buscar etapas do processo
        const etapasQuery = query(
          collection(db, "etapas"),
          where("nup", "==", processoData.nup)
        );
        
        const etapasSnapshot = await getDocs(etapasQuery);
        const etapasList = etapasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EtapaProcesso[];
        
        // Ordenar etapas por data (mais recente primeiro)
        const sortedEtapas = etapasList.sort(
          (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
        );
        
        setEtapas(sortedEtapas);
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
    
    // Em um caso real, você buscaria o perfil do usuário do seu contexto de autenticação
    // Por exemplo: setUserProfile(userContext.profile);
  }, [id]);
  
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
    if (!processo || !editValues || !processo.id) return;
    
    setSaveLoading(true);
    try {
      const processoRef = doc(db, "processos", processo.id);
      
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
  
  // Formatar valor em reais
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  // Determinar cor do chip de status
  const getStatusColor = (data: string) => {    
      const dataInformada = new Date(data);
      const hoje = new Date();

      // Zera a hora para comparar só as datas (sem horas)
      dataInformada.setHours(0, 0, 0, 0);
      hoje.setHours(0, 0, 0, 0);

      const diffMs = hoje.getTime() - dataInformada.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias > 30) return 'error';
      if (diffDias > 15) return 'warning';
      return 'success';
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
      <Grid size={{ xs: 12, md: 6 }} sx={{ py: 1 }}>
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
                InputProps={{
                  startAdornment: field === 'valor' ? <Box component="span" sx={{ mr: 1 }}>R$</Box> : undefined,
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
                mt: 1, 
                p: 1, 
                borderRadius: 1,
                position: 'relative',
                '&:hover': userProfile === 'gerente' ? {
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
              
              {userProfile === 'gerente' && (
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
          onClick={() => navigate('/consultar_processos')}
          sx={{ mt: 2 }}
        >
          Voltar para lista
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Visualização de Processo
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/consultar_processos')}
        >
          Voltar
        </Button>
      </Box>
      
      {/* Dados principais do processo */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardHeader 
          title={`Processo: ${processo.nup}`} 
          titleTypographyProps={{ variant: 'h6' }}
          subheader={processo.status && (
            <Chip 
              label={processo.status} 
              size="small"
              color={getStatusColor(processo.data_etapa_mais_recente) as any}
              sx={{ mt: 1 }}
            />
          )}
          action={
            processo.data_etapa_mais_recente && (
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                Última atualização: {formatarData(processo.data_etapa_mais_recente)}
              </Typography>
            )
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {renderField("NUP", "nup", processo.nup)}
            {renderField("Fonte de Recebimento", "fonte_recebimento", processo.fonte_recebimento)}
            {renderField("UOPM Beneficiada", "uopm_beneficiada", processo.uopm_beneficiada)}
            {renderField("Valor", "valor", processo.valor, "number")}
            {renderField("Quantidade", "quantidade", processo.quantidade, "number")}
            
            <Grid size={{ xs: 12}}>
              {renderField("Objeto", "objeto", processo.objeto)}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Etapas do processo */}
      <Card elevation={2}>
        <CardHeader 
          title="Etapas do Processo" 
          titleTypographyProps={{ variant: 'h6' }}
        />
        <Divider />
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {etapas.length > 0 ? (
                  etapas.map((etapa) => (
                    <TableRow key={etapa.id}>
                      <TableCell>{formatarData(etapa.data)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={etapa.status} 
                          size="small"
                          color={"default"}
                        />
                      </TableCell>
                    </TableRow>
                  ))
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
    </Box>
  );
};

export default VisualizarProcesso;