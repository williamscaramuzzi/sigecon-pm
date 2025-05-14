import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import { 
  Save as SaveIcon,
  Clear as ClearIcon, 
} from '@mui/icons-material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatarMoeda } from './Helpers';

// Interface para o contrato empenhado
interface ContratoEmpenhado {
  num_processo: string;
  num_empenho: string;
  valor: number;
  prazo_entrega: string;
  uopm_beneficiada: string;
  observacoes: string;
}

const CadastrarContratosEmpenhados: React.FC = () => {
  // Estados para os campos do formulário
  const [numProcesso, setNumProcesso] = useState('');
  const [numEmpenho, setNumEmpenho] = useState('');
  const [valor, setValor] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState(new Date().toISOString().slice(0,10));
  const [uopmBeneficiada, setUopmBeneficiada] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Estados para feedback ao usuário
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Função para limpar o formulário
  const handleClear = () => {
    setNumProcesso('');
    setNumEmpenho('');
    setValor('');
    setPrazoEntrega(new Date().toISOString().slice(0,10));
    setUopmBeneficiada('');
    setObservacoes('');
  };

  // Função para enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!numProcesso || !numEmpenho || !valor || !prazoEntrega || !uopmBeneficiada) {
      setSnackbarMessage('Por favor, preencha todos os campos obrigatórios.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    setLoading(true);
    
    try {
      const contratoEmpenhado: ContratoEmpenhado = {
        num_processo: numProcesso,
        num_empenho: numEmpenho,
        valor: Number(valor.replace(/\./g, '').replace(',', '.')),
        prazo_entrega: prazoEntrega,
        uopm_beneficiada: uopmBeneficiada,
        observacoes: observacoes
      };
      
      // Criando um ID único para o documento: num_processo_num_empenho
      const docId = `${numProcesso}`;
      
      // Salvando na coleção contratos_empenhados
      const novoDocRef = doc(db, "contratos_empenhados", docId);
      await setDoc(novoDocRef, contratoEmpenhado);
      
      setSnackbarMessage('Contrato empenhado cadastrado com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleClear();
    } catch (error) {
      console.error('Erro ao cadastrar contrato empenhado:', error);
      setSnackbarMessage('Erro ao cadastrar contrato empenhado. Tente novamente.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Cadastrar Contrato Empenhado
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        Preencha o formulário para cadastrar um novo contrato empenhado no SIGECON-PM
      </Typography>
      
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardHeader 
          title="Dados do Contrato Empenhado" 
          titleTypographyProps={{ variant: 'h5' }} 
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6}}>
                <TextField
                  fullWidth
                  required
                  label="Número do Processo"
                  value={numProcesso}
                  onChange={(e) => setNumProcesso(e.target.value)}
                  placeholder="31.000.000-2025"
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6}}>
                <TextField
                  fullWidth
                  required
                  label="Número do Empenho"
                  value={numEmpenho}
                  onChange={(e) => setNumEmpenho(e.target.value)}
                  placeholder="2025NE000123"
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6}}>
                <TextField
                    fullWidth
                    required
                    label="Valor (R$)"
                    value={valor}
                    onChange={(e)=>{
                        setValor(formatarMoeda(e.target.value));
                    }}
                    placeholder="Ex: 10.000,00"
                    variant="outlined"
                    
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6}}>
                <TextField
                  fullWidth
                  required
                  label="Prazo de Entrega"
                  type="date"
                  value={prazoEntrega}
                  onChange={(e) => setPrazoEntrega(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6}}>
                <TextField
                  fullWidth
                  required
                  label="UOPM Beneficiada"
                  value={uopmBeneficiada}
                  onChange={(e) => setUopmBeneficiada(e.target.value)}
                  placeholder="PMMS, 3º BPM, BPTRAN"
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observações"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais sobre o contrato empenhado"
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12}}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClear}
                    disabled={loading}
                  >
                    Limpar
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar Contrato'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
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
    </Box>
  );
};

export default CadastrarContratosEmpenhados;