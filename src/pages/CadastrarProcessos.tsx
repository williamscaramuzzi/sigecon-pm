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
import { db} from '../config/firebase';

interface ProcessoCompra {
  nup: string,
  fonte_recebimento: string,
  objeto: string,
  quantidade: number,
  uopm_beneficiada: string,
  valor: number, 
  data_etapa_mais_recente: string,
  status: string
}
// Interface para as etapas do processo
interface EtapaProcesso {
  id?: string;
  nup?: string;
  data: string;
  status: string;
  local: string;
}

const CadastrarProcesso: React.FC = () => {
  // Estados para os campos do formulário
  const [nup, setNup] = useState('');
  const [fonte_recebimento, setFonteRecebimento] = useState('');
  const [uopm_beneficiada, setUopmBeneficiado] = useState('');
  const [objeto, setObjeto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valor, setValor] = useState('');
  const [dataEtapa, setDataEtapa] = useState(new Date().toISOString().slice(0,10))
  const [local, setLocal] = useState('')
  const [status, setStatus] = useState('')
  
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
    setDataEtapa(new Date().toISOString().slice(0,10));
    setLocal('');
    setStatus('');
  };

  // Função para enviar o formulário - você implementará a lógica Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!nup || !objeto || !quantidade || !valor || !local || !status) {
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
        valor: Number(valor),
        data_etapa_mais_recente: dataEtapa,
        status
      }
      //padrao do doc é banco de dados, tabela, e indice unico
      const novoDoc = doc(db, "processos", nup)
      await setDoc(novoDoc, processo)

      //Adicionando etapa inicial
      // Crie um ID único para o documento conforme chave cadastrada no firebase: nup_data. Exemplo: 31.000.000-2025_2025-12-31 . Repare que a data é formato ISO para facilitar ordenação.
      const docId = `${nup}_${dataEtapa}`; 
      //padrao do doc é banco de dados, tabela, e indice unico
      const etapaInicialRefCriada = doc(db, "etapas", docId)
      await setDoc(etapaInicialRefCriada, {nup: nup, data: dataEtapa, local: local, status: status})
      
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
        Preencha o formulário para cadastrar um novo processo no SIGECON-PM
      </Typography>
      
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardHeader 
          title="Dados do Processo" 
          titleTypographyProps={{ variant: 'h5' }} 
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
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" component="h1" gutterBottom>
                  Etapa inicial
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }} >
                    <TextField
                      fullWidth
                      label="Data"
                      type="date"
                      onChange={(e)=>{
                        setDataEtapa(e.target.value)
                      }}
                      value={dataEtapa}
                      />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} >
                    <TextField
                      fullWidth
                      label="Local"
                      value={local}
                      onChange={(e)=>{
                        setLocal(e.target.value)
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} >
                    <TextField
                      fullWidth
                      label="Status"
                      onChange={(e)=>{
                        setStatus(e.target.value)
                      }}
                      value={status}
                    />
                  </Grid>
                </Grid>
              </Box>
              
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