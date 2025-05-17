// Interface para as etapas do processo
export interface EtapaProcesso {
  id?: string;
  nup?: string;
  data: string;
  status: string;
  local: string;
}