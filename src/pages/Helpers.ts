/***
 * Arquivo Helpers.ts para concentrar todas as funções que se repetem ao longo do código
 * 
 */
export function decidirCor(data: string): string {
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

// Formatar data
export const formatarData = (data: string) => {
    if (!data) return '';
    try {
      const date = new Date(data.replace(/-/g, '\/').replace(/T.+/, ''));
      return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch (e) {
      return data;
    }
  };

//Formatar number 1000 em R$1.000,00
  export const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };