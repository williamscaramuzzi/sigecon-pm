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
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  TextField
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  FilterAlt as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { decidirCor, formatarData } from './Helpers';
import type { ContratoEmpenhado } from '../models/ProcessoCompra';


// Tipo para a direção da ordenação
type Order = 'asc' | 'desc';

// Propriedade pela qual ordenar
type OrderBy = keyof ContratoEmpenhado;

const ConsultarContratosEmpenhados: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Estado para armazenar os contratos
  const [contratos, setContratos] = useState<ContratoEmpenhado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estado para paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estado para ordenação
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('nup');

  //Estado para filtros de colunas
  const [categoriasUnicas, setCategoriasUnicas] = useState<string[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [mostrarSelectCategoria, setMostrarSelectCategoria] = useState(false);
  const [mostrarFiltroObjeto, setMostrarFiltroObjeto] = useState(false);
  const [textoObjetoFiltro, setTextoObjetoFiltro] = useState('');

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
          ...data
        };
      });
      setContratos(contratosList);
      const categoriasUnicas = Array.from(new Set(contratosList.map(p => p.categoria))).filter(Boolean);
      setCategoriasUnicas(categoriasUnicas)
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

  useEffect(() => {
      setPage(0);
    }, [categoriaFiltro]);

  // Funções para manipular a paginação
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setSearchParams({ page: newPage.toString(), rows: rowsPerPage.toString() })
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rpp = parseInt(event.target.value, 10)
    setRowsPerPage(rpp);
    setPage(0);
    setSearchParams({ page: "0", rows: rpp.toString() })
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
  function compareValues(a: ContratoEmpenhado, b: ContratoEmpenhado, orderBy: OrderBy) {
    // Tratamento especial para o campo número do processo
    if (orderBy === 'nup') {
      return compareNUPs(a.nup, b.nup);
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

  // Primeiro, aplica os filtros, seja da categoria ou objeto
    let processosFiltrados = contratos.filter((p) => {
      const correspondeCategoria = !categoriaFiltro || p.categoria === categoriaFiltro;
      const correspondeObjeto = p.objeto.toLowerCase().includes(textoObjetoFiltro.toLowerCase());
  
      return correspondeCategoria && correspondeObjeto;
    });
  
    // Em seguida, aplica a ordenação
    const processosOrdenados = stableSort(processosFiltrados, getComparator(order, orderBy));
  
    // Por fim, aplica a paginação
    let visibleRows: ContratoEmpenhado[];
    if (rowsPerPage > 0) {
      visibleRows = processosOrdenados.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );
    } else {
      visibleRows = processosOrdenados;
    }

  // Renderizar rótulo de "Todos" na paginação
  const getLabelDisplayedRows = ({ from, to, count }: { from: number; to: number; count: number }) => {
    return `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`;
  };

  // Função para ver detalhes do contrato
  const handleVerContrato = (id: string) => {
    navigate(`/contrato_empenhado/${id}`);
  };

  return (
    <Box>
      <Typography variant="h5" component="h5" gutterBottom>
        Processos com empenho
      </Typography>

      <Card elevation={2} sx={{ mt: 3 }}>

        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mb: 2, maxHeight: "85vh" }}>
                <Table sx={{ minWidth: 650 }} aria-label="tabela de contratos empenhados">
                  <TableHead sx={{
                    '& .MuiTableCell-root': {
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    },
                  }}>
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
                        <Box display="flex" alignItems="center">
                          <TableSortLabel
                            active={orderBy === 'categoria'}
                            direction={orderBy === 'categoria' ? order : 'asc'}
                            onClick={() => handleRequestSort('categoria')}
                          >
                            Categoria
                          </TableSortLabel>
                          <IconButton size="small" onClick={() => setMostrarSelectCategoria(!mostrarSelectCategoria)}>
                            <FilterIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {mostrarSelectCategoria && (
                          <Box mt={1} display="flex" alignItems="center">
                            <FormControl fullWidth size="small">
                              <Select
                                value={categoriaFiltro ?? ''}
                                onChange={(e) =>
                                  setCategoriaFiltro(e.target.value === '' ? null : e.target.value)
                                }
                                displayEmpty
                              >
                                <MenuItem value="">Todas</MenuItem>
                                {categoriasUnicas.map((cat) => (
                                  <MenuItem key={cat} value={cat}>
                                    {cat}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setCategoriaFiltro(null);
                                setMostrarSelectCategoria(false);
                              }}
                              sx={{ ml: 1 }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>


                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <TableSortLabel
                            active={orderBy === 'objeto'}
                            direction={orderBy === 'objeto' ? order : 'asc'}
                            onClick={() => handleRequestSort('objeto')}
                          >
                            Objeto
                          </TableSortLabel>
                          <IconButton size="small" onClick={() => setMostrarFiltroObjeto(!mostrarFiltroObjeto)}>
                            <FilterIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {mostrarFiltroObjeto && (
                          <Box mt={1} display="flex" alignItems="center">
                            <TextField
                              size="small"
                              variant="standard"
                              placeholder="Filtrar objeto"
                              value={textoObjetoFiltro}
                              onChange={(e) => setTextoObjetoFiltro(e.target.value)}
                              fullWidth
                            />
                            <IconButton
                              size="small"
                              onClick={() => {
                                setTextoObjetoFiltro('');
                                setMostrarFiltroObjeto(false);
                              }}
                              sx={{ ml: 1 }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleRows.length > 0 ? (
                      visibleRows.map((contrato) => (
                        <TableRow
                          key={contrato.nup}
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
                                onClick={() => handleVerContrato(contrato.nup)}
                                color="primary"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{contrato.nup}</TableCell>
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
                          <TableCell>{contrato.categoria}</TableCell>
                          <TableCell>
                            {contrato.objeto.length > 100
                              ? `${contrato.objeto.substring(0, 100)}...`
                              : contrato.objeto}
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
                count={processosFiltrados.length}
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