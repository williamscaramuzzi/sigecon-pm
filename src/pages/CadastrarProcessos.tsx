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
  Snackbar
} from '@mui/material';
import { 
  Save as SaveIcon,
  Clear as ClearIcon 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db} from '../config/firebase';

interface ProcessoCompra {
  nup: string,
  fonte_recebimento: string,
  objeto: string,
  quantidade: number,
  uopm_beneficiada: string,
  valor: number
}

const CadastrarProcesso: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Estados para os campos do formulário
  const [nup, setNup] = useState('');
  const [fonte_recebimento, setFonteRecebimento] = useState('');
  const [uopm_beneficiada, setUopmBeneficiado] = useState('');
  const [objeto, setObjeto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valor, setValor] = useState('');
  
  // Estados para feedback ao usuário
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Função para limpar o formulário
  const handleClear = () => {
    setNup('');
    setFonteRecebimento('');
    setUopmBeneficiado('');
    setObjeto('');
    setQuantidade('');
    setValor('');
  };

  // Função para enviar o formulário - você implementará a lógica Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!nup || !objeto || !quantidade || !valor) {
      setSnackbarMessage('Por favor, preencha todos os campos obrigatórios.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    setLoading(true);
    
    try {
      const processo: ProcessoCompra = {
        nup,
        fonte_recebimento,
        objeto,
        quantidade: Number(quantidade),
        uopm_beneficiada,
        valor: Number(valor)
      }
      //padrao do doc é banco de dados, tabela, e indice unico
      const novoDoc = doc(db, "processos", nup)
      await setDoc(novoDoc, processo)
      
      setSnackbarMessage('Processo cadastrado com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleClear();
    } catch (error) {
      console.error('Erro ao cadastrar processo:', error);
      setSnackbarMessage('Erro ao cadastrar processo. Tente novamente.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Cadastrar Processo
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        Preencha o formulário para cadastrar um novo processo no SIGECOM-PM
      </Typography>
      
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardHeader 
          title="Dados do Processo" 
          titleTypographyProps={{ variant: 'h6' }} 
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="NUP"
                  value={nup}
                  onChange={(e) => setNup(e.target.value)}
                  placeholder="31.000.000-2025"
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Fonte de Recebimento"
                  value={fonte_recebimento}
                  onChange={(e) => setFonteRecebimento(e.target.value)}
                  placeholder="SEJUSP, FESP, Convenio Federal"
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="UOPM Beneficiada"
                  value={uopm_beneficiada}
                  onChange={(e) => setUopmBeneficiado(e.target.value)}
                  placeholder="PMMS, 3º BPM, BPTRAN"
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  label="Objeto"
                  value={objeto}
                  onChange={(e) => setObjeto(e.target.value)}
                  placeholder="Descreva o objeto do processo"
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Quantidade"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  InputProps={{ inputProps: { min: 1 } }}
                  variant="outlined"
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6}}>
                <TextField
                  fullWidth
                  required
                  label="Valor (R$)"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Ex: 10000.00"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Box component="span" sx={{ mr: 1 }}>R$</Box>,
                  }}
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
                    {loading ? 'Cadastrando...' : 'Cadastrar Processo'}
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

export default CadastrarProcesso;