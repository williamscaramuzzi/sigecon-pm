/***
 * Arquivo Helpers.ts para concentrar todas as funções que se repetem ao longo do código
 * 
 */

export function diferencaEmDias(primeira_data: string, segunda_data: string): number {
    const data1 = new Date(primeira_data);
    const data2 = new Date(segunda_data);
  
    // Zera as horas para considerar apenas a diferença de dias
    data1.setHours(0, 0, 0, 0);
    data2.setHours(0, 0, 0, 0);
  
    const diffEmMs = Math.abs(data2.getTime() - data1.getTime());
    const diffEmDias = Math.floor(diffEmMs / (1000 * 60 * 60 * 24));
  
    return diffEmDias
  }

export function decidirCor(data: string): string {
  const dataInformada = new Date(data);
  const hoje = new Date();
  const diffDias = diferencaEmDias(dataInformada.toISOString(), hoje.toISOString())

  if (diffDias > 30) return 'red';
  if (diffDias > 15) return 'orange';
  return 'green';
}

export function decidirCorChip(data: string): string {
  const dataInformada = new Date(data);
  const hoje = new Date();
  const diffDias = diferencaEmDias(dataInformada.toISOString(), hoje.toISOString())

  if (diffDias > 30) return 'error';
  if (diffDias > 15) return 'warning';
  return 'success';
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

  // Função para formatar o valor como moeda brasileira
  export const formatarMoeda = (value: string) => {
    // Remover caracteres não numéricos
    const valor = value.replace(/\D/g, '');

    // Substituir vírgula por ponto
    const valorFormatado = valor.replace(',', '.');
    
    // Converte para número e divide por 100 para considerar os centavos
    const valorNumerico = parseFloat(valorFormatado) / 100;
    
    // Formata o número como moeda brasileira
    if (!isNaN(valorNumerico)) {
      return valorNumerico.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    
    return '';
  };

  