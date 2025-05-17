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
  IconButton,
  Autocomplete
} from '@mui/material';
import { 
  Save as SaveIcon,
  Clear as ClearIcon, 
} from '@mui/icons-material';
import { collection, getDocs, doc, setDoc, query, where} from 'firebase/firestore';
import { db} from '../config/firebase';
import { formatarMoeda } from './Helpers';
import { listalocais } from './listalocais';

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

interface ProcessoCompraAtualizado extends ProcessoCompra {
  data_primeira_etapa: string
}
// Interface para as etapas do processo
interface EtapaProcesso {
  id?: string;
  nup?: string;
  data: string;
  status: string;
  local: string;
}

const Desenvolvimento: React.FC = () => {
  // Estados para os campos do formulário
const [nup, setNup] = useState('');
const [fonte_recebimento, setFonteRecebimento] = useState('');
const [objeto, setObjeto] = useState('');
const [quantidade, setQuantidade] = useState('');
const [uopm_beneficiada, setUopmBeneficiado] = useState('');
const [valor, setValor] = useState('');
const [data_etapa_mais_recente, setDataEtapaMaisRecente] = useState("")
const [data_primeira_etapa, setDataPrimeiraEtapa] = useState("")
const [status, setStatus] = useState('')
const [processos, setProcessos] = useState<ProcessoCompra[]>([]);

const [conteudoTextArea, setConteudoTextArea] = useState('')

const clearFields = () => {
    setNup('');
    setFonteRecebimento('');
    setObjeto('');
    setQuantidade('');
    setUopmBeneficiado('');
    setValor('');
    setDataEtapaMaisRecente('');
    setDataPrimeiraEtapa('');
    setStatus('');
};

async function executar(e: any){
try {
    let grandeTexto = ""
      const processosCollection = collection(db, "processos_dois");
      const processosSnapshot = await getDocs(processosCollection);
      const processosList: ProcessoCompraAtualizado[] = processosSnapshot.docs.map((doc) => {
        const data = doc.data() as ProcessoCompraAtualizado;
        return {
          ...data
        };
      });
      
      processosList.forEach(async(processo)=>{
        const novoDoc = doc(db, "processos", processo.nup)
        await setDoc(novoDoc, processo)
      })
      
      setConteudoTextArea(grandeTexto)
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
    } finally {
      setConteudoTextArea(prev=>{
        return prev + "\nfinally"
      })
    }

}


  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Testes desenvolvimento
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        Preencha o formulário para cadastrar um novo processo no SIGECON-PM
      </Typography>

      <Button variant='outlined' onClick={(e) => {executar(e)}}>Executar</Button>
        <br />
      <textarea id="textarea" name="textarea" rows={5} cols={100} value={conteudoTextArea} disabled/>
    </Box>
  );
};

export default Desenvolvimento;