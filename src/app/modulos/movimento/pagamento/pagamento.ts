export enum FormaPagamento {
  Pix = 10,
  CartaoCredito = 20,
  CartaoDebito = 30,
  Dinheiro = 40,
}

export enum EntregaTipo {
  Retirada = 10,
  Entrega = 20,
}

export enum TrocoMotivo {
  NaoInformado = 'nao-informado',
  Insuficiente = 'insuficiente',
}

export type TrocoResultado = {
  valido: boolean;
  troco: number;
  motivo?: TrocoMotivo;
};

// `trocoPara` e o valor com que o cliente vai pagar, nao o troco: guardar a nota permite
// recalcular quando o total muda. NaoInformado e Insuficiente sao distintos de proposito -
// campo vazio e estado inicial normal, valor abaixo do total e erro.
export function trocoCalcula(trocoPara: number, total: number): TrocoResultado {
  if (!trocoPara || !(trocoPara > 0)) {
    return { valido: false, troco: 0, motivo: TrocoMotivo.NaoInformado };
  }
  if (trocoPara < total) {
    return { valido: false, troco: 0, motivo: TrocoMotivo.Insuficiente };
  }
  return { valido: true, troco: Math.round((trocoPara - total) * 100) / 100 };
}
