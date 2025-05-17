export interface ProcessoCompra {
  nup: string,
  fonte_recebimento: string,
  objeto: string,
  quantidade: number,
  uopm_beneficiada: string,
  valor: number, 
  data_primeira_etapa: string, 
  data_etapa_mais_recente: string,
  status: string
}