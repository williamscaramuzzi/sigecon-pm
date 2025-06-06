export interface ProcessoCompra {
  nup: string,
  num_sgc: string,
  fonte_recebimento: string,
  categoria: string,
  objeto: string,
  quantidade: number,
  uopm_beneficiada: string,
  valor: number, 
  data_primeira_etapa: string, 
  data_etapa_mais_recente: string,
  status: string
}

// Interface para os dados do contrato empenhado
export interface ContratoEmpenhado extends ProcessoCompra {
  num_empenho: string,
  prazo_entrega: string
}