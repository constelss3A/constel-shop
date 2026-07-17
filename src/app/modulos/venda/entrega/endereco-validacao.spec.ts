import { Endereco } from './endereco';
import { ENDERECO_OBRIGATORIOS, enderecoCamposFaltando } from './endereco-validacao';

function enderecoCompleto(sobrescreve: Partial<Endereco> = {}): Endereco {
  return Object.assign(new Endereco(), {
    apelido: 'Casa',
    cep: '60160-230',
    logradouro: 'Avenida Dom Luís',
    numero: '100',
    complemento: '',
    bairro: 'Meireles',
    cidade: 'Fortaleza',
    uf: 'CE',
    pontoReferencia: '',
    ...sobrescreve,
  });
}

describe('enderecoCamposFaltando', () => {
  it('nao acusa nada quando o endereco esta completo', () => {
    expect(enderecoCamposFaltando(enderecoCompleto())).toEqual([]);
  });

  it('nao exige apelido, complemento nem ponto de referencia', () => {
    const semOpcionais = enderecoCompleto({ apelido: '', complemento: '', pontoReferencia: '' });
    expect(enderecoCamposFaltando(semOpcionais)).toEqual([]);
  });

  it('acusa cada obrigatorio que faltar', () => {
    for (const campo of ENDERECO_OBRIGATORIOS) {
      const faltando = enderecoCamposFaltando(enderecoCompleto({ [campo.campo]: '' }));
      expect(faltando.length).toBe(1);
      expect(faltando[0].campo).toBe(campo.campo);
    }
  });

  // O toast antigo parava no primeiro erro; o formulario tem que mostrar todos de uma vez,
  // senao preencher um endereco vazio vira seis rodadas de tentativa e erro.
  it('devolve todos os faltando de uma vez, nao so o primeiro', () => {
    const vazio = Object.assign(new Endereco(), {});
    expect(enderecoCamposFaltando(vazio).length).toBe(ENDERECO_OBRIGATORIOS.length);
  });

  it('trata espaco em branco como vazio', () => {
    expect(enderecoCamposFaltando(enderecoCompleto({ numero: '   ' })).length).toBe(1);
  });

  it('exige que o cep tenha oito digitos, nao so estar preenchido', () => {
    const curto = enderecoCamposFaltando(enderecoCompleto({ cep: '60160' }));
    expect(curto.length).toBe(1);
    expect(curto[0].campo).toBe('cep');
  });

  it('nao estoura com endereco nulo', () => {
    expect(enderecoCamposFaltando(null).length).toBe(ENDERECO_OBRIGATORIOS.length);
  });

  it('cada obrigatorio tem rotulo para a tela mostrar', () => {
    for (const campo of ENDERECO_OBRIGATORIOS) {
      expect(campo.rotulo).toBeTruthy();
    }
  });
});
