import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TablePagination, 
  TableSortLabel, 
  IconButton, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Visibility as VisibilityIcon} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

// Interface para os dados do processo
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

// Tipo para a direção da ordenação
type Order = 'asc' | 'desc';

// Propriedade pela qual ordenar
type OrderBy = keyof ProcessoCompra;

const ConsultarProcessos: React.FC = () => {
const navigate = useNavigate();
  // Estado para armazenar os processos
  const [processos, setProcessos] = useState<ProcessoCompra[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado para paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para ordenação
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('nup');

  // Opções de quantidade de itens por página
  const rowsPerPageOptions = [
    {value: 10, label: "10"},
    {value: 20, label: "20"},
    {value: 50, label: "50"},
    {value: -1, label: "Todos"}
  ];
  
  // Função para buscar processos do Firestore
  const fetchProcessos = async () => {
    setLoading(true);
    try {
      const processosCollection = collection(db, "processos");
      const processosSnapshot = await getDocs(processosCollection);
      const processosList: ProcessoCompra[] = processosSnapshot.docs.map(doc => {
        const data = doc.data() as ProcessoCompra;
        return {
          id: doc.id,
          ...data
        };
      });
      setProcessos(processosList);
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar processos quando o componente montar
  useEffect(() => {
    fetchProcessos();
  }, []);
  
  // Funções para manipular a paginação
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Função para lidar com a solicitação de ordenação
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Função personalizada para comparar NUPs considerando o ano primeiro
    function compareNUPs(nupA: string, nupB: string): number {
    // Extrair o ano do NUP (assumindo que esteja após o último hífen)
    const getYear = (nup: string): number => {
        const parts = nup.split('-');
        return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
    };

    // Extrair o número principal (parte antes do ano)
    const getMainNumber = (nup: string): string => {
        const parts = nup.split('-');
        return parts.length > 1 ? parts[0] : nup;
    };

    // Primeiro comparar os anos
    const yearA = getYear(nupA);
    const yearB = getYear(nupB);
    
    if (yearA !== yearB) {
        return yearA - yearB; // Ordem crescente por ano
    }
    
    // Se os anos forem iguais, comparar o resto do número
    const mainA = getMainNumber(nupA);
    const mainB = getMainNumber(nupB);
    
    return mainA.localeCompare(mainB);
    }
  // Função para comparar colunas ao ordenar
 function compareValues(a: ProcessoCompra, b: ProcessoCompra, orderBy: OrderBy) {
  // Tratamento especial para o campo NUP
  if (orderBy === 'nup') {
    return compareNUPs(a.nup, b.nup);
  }
  
  // Lógica existente para os outros campos
  const valueA = String(a[orderBy]).toLowerCase();
  const valueB = String(b[orderBy]).toLowerCase();
  
  if (valueB < valueA) {
    return 1;
  }
  if (valueB > valueA) {
    return -1;
  }
  return 0;
}
  
  // Função para estabilizar a ordenação
  function stableSort(array: ProcessoCompra[], comparator: (a: ProcessoCompra, b: ProcessoCompra) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [ProcessoCompra, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }
  
  // Função que retorna uma função de comparação baseada na ordem atual
  function getComparator(order: Order, orderBy: OrderBy): (a: ProcessoCompra, b: ProcessoCompra) => number {
    return order === 'desc'
      ? (a, b) => compareValues(a, b, orderBy)
      : (a, b) => -compareValues(a, b, orderBy);
  }
  
  // Aplicar paginação e ordenação aos dados
  const visibleRows = stableSort(processos, getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Renderizar rótulo de "Todos" na paginação
  const getLabelDisplayedRows = ({ from, to, count }: { from: number; to: number; count: number }) => {
    return `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`;
  };

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
        Consultar Processos
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        Visualize e gerencie os processos cadastrados no SIGECOM-PM
      </Typography>
      
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardHeader 
          title="Processos Cadastrados" 
          titleTypographyProps={{ variant: 'h6' }} 
        />
        <Divider />
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table sx={{ minWidth: 650 }} aria-label="tabela de processos">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ações</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'nup'}
                          direction={orderBy === 'nup' ? order : 'asc'}
                          onClick={() => handleRequestSort('nup')}
                        >
                          NUP
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'fonte_recebimento'}
                          direction={orderBy === 'fonte_recebimento' ? order : 'asc'}
                          onClick={() => handleRequestSort('fonte_recebimento')}
                        >
                          Fonte de Recebimento
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'uopm_beneficiada'}
                          direction={orderBy === 'uopm_beneficiada' ? order : 'asc'}
                          onClick={() => handleRequestSort('uopm_beneficiada')}
                        >
                          UOPM Beneficiada
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'objeto'}
                          direction={orderBy === 'objeto' ? order : 'asc'}
                          onClick={() => handleRequestSort('objeto')}
                        >
                          Objeto
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'quantidade'}
                          direction={orderBy === 'quantidade' ? order : 'asc'}
                          onClick={() => handleRequestSort('quantidade')}
                        >
                          Quantidade
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'valor'}
                          direction={orderBy === 'valor' ? order : 'asc'}
                          onClick={() => handleRequestSort('valor')}
                        >
                          Valor (R$)
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'data_etapa_mais_recente'}
                          direction={orderBy === 'data_etapa_mais_recente' ? order : 'asc'}
                          onClick={() => handleRequestSort('data_etapa_mais_recente')}
                        >
                          Data última etapa
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'status'}
                          direction={orderBy === 'status' ? order : 'asc'}
                          onClick={() => handleRequestSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleRows.length > 0 ? (
                      visibleRows.map((processo) => (
                        <TableRow
                            key={processo.id || processo.nup}
                            hover
                            sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                                '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)', 
                                },
                            }}
                            >

                          <TableCell>
                            <Tooltip title="Ver detalhes">
                              <IconButton 
                                size="small" 
                                onClick={() => handleVerProcesso(processo.id || processo.nup)}
                                color="primary"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{processo.nup}</TableCell>
                          <TableCell>{processo.fonte_recebimento}</TableCell>
                          <TableCell>{processo.uopm_beneficiada}</TableCell>
                          <TableCell>
                            {processo.objeto.length > 100 
                              ? `${processo.objeto.substring(0, 100)}...` 
                              : processo.objeto}
                          </TableCell>
                          <TableCell>{processo.quantidade}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(processo.valor)}
                          </TableCell>
                          <TableCell sx={{color: `${decidirCor(processo.data_etapa_mais_recente)}`}}>{formatarData(processo.data_etapa_mais_recente)}</TableCell>
                          <TableCell>{processo.status}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          Nenhum processo encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={rowsPerPageOptions}
                component="div"
                count={processos.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Itens por página:"
                labelDisplayedRows={getLabelDisplayedRows}
                getItemAriaLabel={(type) => `Ir para ${type === 'first' ? 'primeira' : type === 'last' ? 'última' : type === 'next' ? 'próxima' : 'anterior'} página`}
                showFirstButton
                showLastButton
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ConsultarProcessos;