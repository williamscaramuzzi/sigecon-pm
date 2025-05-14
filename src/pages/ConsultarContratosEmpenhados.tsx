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
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { decidirCor, formatarData } from './Helpers';

// Interface para os dados do contrato empenhado
interface ContratoEmpenhado {
  id?: string;
  num_processo: string;
  num_empenho: string;
  valor: number;
  prazo_entrega: string;
  uopm_beneficiada: string;
  observacoes: string;
}

// Tipo para a direção da ordenação
type Order = 'asc' | 'desc';

// Propriedade pela qual ordenar
type OrderBy = keyof ContratoEmpenhado;

const ConsultarContratosEmpenhados: React.FC = () => {
  const navigate = useNavigate();
  // Estado para armazenar os contratos
  const [contratos, setContratos] = useState<ContratoEmpenhado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estado para paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estado para ordenação
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('num_processo');

  // Opções de quantidade de itens por página
  const rowsPerPageOptions = [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 50, label: "50" },
    { value: -1, label: "Todos" }
  ];

  // Função para buscar contratos do Firestore
  const fetchContratos = async () => {
    setLoading(true);
    try {
      const contratosCollection = collection(db, "contratos_empenhados");
      const contratosSnapshot = await getDocs(contratosCollection);
      const contratosList: ContratoEmpenhado[] = contratosSnapshot.docs.map(doc => {
        const data = doc.data() as ContratoEmpenhado;
        return {
          id: doc.id,
          ...data
        };
      });
      setContratos(contratosList);
    } catch (error) {
      console.error("Erro ao buscar contratos empenhados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar contratos quando o componente montar
  useEffect(() => {
    fetchContratos();
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

  // Função personalizada para comparar números de processo
  function compareProcessNumbers(numA: string, numB: string): number {
    // Extrair o ano do número do processo (assumindo que esteja após o último hífen)
    const getYear = (num: string): number => {
      const parts = num.split('-');
      return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
    };

    // Extrair o número principal (parte antes do ano)
    const getMainNumber = (num: string): string => {
      const parts = num.split('-');
      return parts.length > 1 ? parts[0] : num;
    };

    // Primeiro comparar os anos
    const yearA = getYear(numA);
    const yearB = getYear(numB);

    if (yearA !== yearB) {
      return yearA - yearB; // Ordem crescente por ano
    }

    // Se os anos forem iguais, comparar o resto do número
    const mainA = getMainNumber(numA);
    const mainB = getMainNumber(numB);

    return mainA.localeCompare(mainB);
  }

  // Função para comparar colunas ao ordenar
  function compareValues(a: ContratoEmpenhado, b: ContratoEmpenhado, orderBy: OrderBy) {
    // Tratamento especial para o campo número do processo
    if (orderBy === 'num_processo') {
      return compareProcessNumbers(a.num_processo, b.num_processo);
    }

    // Lógica de ordenação pelo valor R$
    if (orderBy === 'valor') {
      const valorA = a[orderBy];
      const valorB = b[orderBy];
      if (valorA < valorB) return -1;
      if (valorA > valorB) return 1;
      return 0;
    }

    // Lógica de ordenação para prazo de entrega (datas)
    if (orderBy === 'prazo_entrega') {
      const dateA = new Date(a[orderBy]);
      const dateB = new Date(b[orderBy]);
      return dateA.getTime() - dateB.getTime();
    }

    // Lógica existente para os outros campos
    const valueA = String(a[orderBy]).toLowerCase();
    const valueB = String(b[orderBy]).toLowerCase();

    if (valueA < valueB) {
      return -1;
    }
    if (valueA > valueB) {
      return 1;
    }
    return 0;
  }

  // Função para estabilizar a ordenação
  function stableSort(array: ContratoEmpenhado[], comparator: (a: ContratoEmpenhado, b: ContratoEmpenhado) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [ContratoEmpenhado, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  // Função que retorna uma função de comparação baseada na ordem atual
  function getComparator(order: Order, orderBy: OrderBy): (a: ContratoEmpenhado, b: ContratoEmpenhado) => number {
    return order === 'desc'
      ? (a, b) => compareValues(a, b, orderBy)
      : (a, b) => -compareValues(a, b, orderBy);
  }

  // Aplicar paginação e ordenação aos dados
  let visibleRows: ContratoEmpenhado[];
  if (rowsPerPage > 0) {
    visibleRows = stableSort(contratos, getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }
  else {
    // Quando entra nesse else, é porque selecionou "todos" em "itens por página". O valor de Todos é -1.
    visibleRows = stableSort(contratos, getComparator(order, orderBy));
  }

  // Renderizar rótulo de "Todos" na paginação
  const getLabelDisplayedRows = ({ from, to, count }: { from: number; to: number; count: number }) => {
    return `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`;
  };

  // Função para ver detalhes do contrato
  const handleVerContrato = (id: string) => {
    navigate(`/contrato/${id}`);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Consultar Contratos Empenhados
      </Typography>

      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        Visualize e gerencie os contratos empenhados cadastrados no SIGECON-PM
      </Typography>

      <Card elevation={2} sx={{ mt: 3 }}>
        <CardHeader
          title="Contratos Empenhados Cadastrados"
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
                <Table sx={{ minWidth: 650 }} aria-label="tabela de contratos empenhados">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ações</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'num_processo'}
                          direction={orderBy === 'num_processo' ? order : 'asc'}
                          onClick={() => handleRequestSort('num_processo')}
                        >
                          Número do Processo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'num_empenho'}
                          direction={orderBy === 'num_empenho' ? order : 'asc'}
                          onClick={() => handleRequestSort('num_empenho')}
                        >
                          Número do Empenho
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
                          active={orderBy === 'prazo_entrega'}
                          direction={orderBy === 'prazo_entrega' ? order : 'asc'}
                          onClick={() => handleRequestSort('prazo_entrega')}
                        >
                          Prazo de Entrega
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
                          active={orderBy === 'observacoes'}
                          direction={orderBy === 'observacoes' ? order : 'asc'}
                          onClick={() => handleRequestSort('observacoes')}
                        >
                          Observações
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleRows.length > 0 ? (
                      visibleRows.map((contrato) => (
                        <TableRow
                          key={contrato.id || `${contrato.num_processo}_${contrato.num_empenho}`}
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
                                disabled
                                size="small"
                                onClick={() => handleVerContrato(contrato.id || `${contrato.num_processo}_${contrato.num_empenho}`)}
                                color="primary"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{contrato.num_processo}</TableCell>
                          <TableCell>{contrato.num_empenho}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(contrato.valor)}
                          </TableCell>
                          <TableCell sx={{ color: `${decidirCor(contrato.prazo_entrega)}` }}>
                            {formatarData(contrato.prazo_entrega)}
                          </TableCell>
                          <TableCell>{contrato.uopm_beneficiada}</TableCell>
                          <TableCell>
                            {contrato.observacoes && contrato.observacoes.length > 100
                              ? `${contrato.observacoes.substring(0, 100)}...`
                              : contrato.observacoes}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          Nenhum contrato empenhado encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={rowsPerPageOptions}
                component="div"
                count={contratos.length}
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

export default ConsultarContratosEmpenhados;