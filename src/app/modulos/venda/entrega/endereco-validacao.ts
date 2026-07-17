import { Endereco, cepValido } from './endereco';

export type EnderecoCampoObrigatorio = {
  campo: keyof Endereco;
  rotulo: string;
  // Regra propria quando "estar preenchido" nao basta. Sem ela, vale nao estar vazio.
  valida?: (valor: string) => boolean;
};

// Fonte unica do asterisco na tela e da cobranca no Salvar: as duas leem esta lista.
export const ENDERECO_OBRIGATORIOS: EnderecoCampoObrigatorio[] = [
  { campo: 'cep', rotulo: 'CEP', valida: cepValido },
  { campo: 'logradouro', rotulo: 'Logradouro' },
  { campo: 'numero', rotulo: 'Número' },
  { campo: 'bairro', rotulo: 'Bairro' },
  { campo: 'cidade', rotulo: 'Cidade' },
  { campo: 'uf', rotulo: 'UF' },
];

export function enderecoCamposFaltando(endereco: Endereco): EnderecoCampoObrigatorio[] {
  return ENDERECO_OBRIGATORIOS.filter(obrigatorio => {
    const valor = (endereco?.[obrigatorio.campo] as string || '').trim();
    return obrigatorio.valida ? !obrigatorio.valida(valor) : !valor;
  });
}

export function enderecoCampoFalta(faltando: EnderecoCampoObrigatorio[], campo: keyof Endereco): boolean {
  return faltando.some(f => f.campo === campo);
}
