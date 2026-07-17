import { TrocoMotivo, trocoCalcula } from './pagamento';

export type TrocoResumo = { texto: string; pendente: boolean };

// O troco tem quatro estados, nao dois: nao precisa, decidido, ainda nao informado e
// insuficiente. `pendente` marca os dois que ainda impedem fechar o pedido.
export function trocoResumoTexto(necessario: boolean, trocoPara: number, total: number): TrocoResumo {
  if (!necessario) {
    return { texto: 'Não precisa', pendente: false };
  }
  const troco = trocoCalcula(trocoPara, total);
  if (troco.valido) {
    return { texto: `Para ${real(trocoPara)}`, pendente: false };
  }
  return troco.motivo === TrocoMotivo.Insuficiente
    ? { texto: 'Valor menor que o total', pendente: true }
    : { texto: 'A informar', pendente: true };
}

function real(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}
