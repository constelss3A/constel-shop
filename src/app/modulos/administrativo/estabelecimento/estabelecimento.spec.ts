import {
  Estabelecimento,
  EstabelecimentoEndereco,
  estabelecimentoEnderecoOrigem,
  estabelecimentoEnderecoQueries,
} from './estabelecimento';

// Espelha o payload real de
// GET aps://integracao/cardapio/estabelecimento/089379b8-38dd-4f92-81ed-f93daa443907
// (Filial Brasilia), capturado em 2026-07-16.
function enderecoReal(sobrescreve: Partial<EstabelecimentoEndereco> = {}): EstabelecimentoEndereco {
  return {
    id: '10a68c2e-4291-456f-8870-c93a2fc20fc6',
    nome: 'Principal',
    favorito: true,
    entrega: true,
    retirada: true,
    cep: '70.747-030',
    logradouro: 'Quadra SQN 308 Bloco C',
    numero: 45,
    complemento: null,
    bairro: 'Asa Norte',
    uf: { codigo: '53', nome: 'Distrito Federal', sigla: 'DF' },
    municipio: { codigo: '5300108', nome: 'Brasília' },
    referencia: null,
    ...sobrescreve,
  } as EstabelecimentoEndereco;
}

function estabelecimentoCom(enderecos: EstabelecimentoEndereco[]): Estabelecimento {
  return Object.assign(new Estabelecimento(), {
    id: '089379b8-38dd-4f92-81ed-f93daa443907',
    codigo: '04',
    nome: 'Filial Brasília',
    situacao: 1,
    estabelecimentoEnderecos: enderecos,
  });
}

describe('estabelecimentoEnderecoOrigem', () => {
  it('devolve null quando o estabelecimento e nulo', () => {
    expect(estabelecimentoEnderecoOrigem(null)).toBeNull();
  });

  it('devolve null quando estabelecimentoEnderecos nao veio no payload', () => {
    expect(estabelecimentoEnderecoOrigem(Object.assign(new Estabelecimento(), { id: 'e1' }))).toBeNull();
  });

  it('devolve null quando a lista de enderecos esta vazia', () => {
    expect(estabelecimentoEnderecoOrigem(estabelecimentoCom([]))).toBeNull();
  });

  it('devolve o endereco marcado como entrega', () => {
    const correspondencia = enderecoReal({ entrega: false, favorito: false, logradouro: 'Rua B' });
    const entrega = enderecoReal({ entrega: true, favorito: false });
    expect(estabelecimentoEnderecoOrigem(estabelecimentoCom([correspondencia, entrega]))).toBe(entrega);
  });

  it('cai no favorito quando nenhum endereco esta marcado como entrega', () => {
    const comum = enderecoReal({ entrega: false, favorito: false, logradouro: 'Rua B' });
    const favorito = enderecoReal({ entrega: false, favorito: true });
    expect(estabelecimentoEnderecoOrigem(estabelecimentoCom([comum, favorito]))).toBe(favorito);
  });

  it('cai no primeiro localizavel quando nao ha flag de entrega nem favorito', () => {
    const primeiro = enderecoReal({ entrega: false, favorito: false });
    const segundo = enderecoReal({ entrega: false, favorito: false, logradouro: 'Rua B' });
    expect(estabelecimentoEnderecoOrigem(estabelecimentoCom([primeiro, segundo]))).toBe(primeiro);
  });

  it('ignora endereco que nao localiza, mesmo marcado como entrega', () => {
    const vazio = enderecoReal({ entrega: true, logradouro: null, municipio: null });
    const util = enderecoReal({ entrega: true });
    expect(estabelecimentoEnderecoOrigem(estabelecimentoCom([vazio, util]))).toBe(util);
  });
});

describe('estabelecimentoEnderecoQueries', () => {
  it('comeca pela busca mais precisa, com numero', () => {
    expect(estabelecimentoEnderecoQueries(enderecoReal())[0])
      .toBe('Quadra SQN 308 Bloco C, 45, Asa Norte, Brasília, DF, Brasil');
  });

  // Verificado ao vivo contra o Nominatim em 2026-07-16: "Quadra SQN 308" (logradouro real
  // sem o bloco) casa com a quadra 408, 1,4 km fora, sem sinalizar erro. Nao mexemos no
  // logradouro justamente para nao trocar "sem resultado" por "resultado errado".
  it('nao tenta consertar o logradouro removendo o bloco', () => {
    const queries = estabelecimentoEnderecoQueries(enderecoReal());
    expect(queries).not.toContain('Quadra SQN 308, Asa Norte, Brasília, DF, Brasil');
  });

  it('degrada ate bairro e municipio', () => {
    const queries = estabelecimentoEnderecoQueries(enderecoReal());
    expect(queries).toContain('Asa Norte, Brasília, DF, Brasil');
    expect(queries).toContain('Brasília, DF, Brasil');
  });

  it('vai do mais preciso para o mais generico', () => {
    const queries = estabelecimentoEnderecoQueries(enderecoReal());
    expect(queries[0].length).toBeGreaterThan(queries[queries.length - 1].length);
  });

  it('usa a sigla da uf, nao o nome', () => {
    const primeira = estabelecimentoEnderecoQueries(enderecoReal())[0];
    expect(primeira).toContain('DF');
    expect(primeira).not.toContain('Distrito Federal');
  });

  it('nao repete a mesma busca quando o logradouro nao tem bloco', () => {
    const queries = estabelecimentoEnderecoQueries(enderecoReal({ logradouro: 'Av Beira Mar' }));
    expect(queries.length).toBe(new Set(queries).size);
  });

  it('omite os campos ausentes sem deixar virgula solta', () => {
    expect(estabelecimentoEnderecoQueries(enderecoReal({ numero: null, bairro: null })))
      .toContain('Quadra SQN 308 Bloco C, Brasília, DF, Brasil');
  });

  it('devolve lista vazia quando o endereco e nulo', () => {
    expect(estabelecimentoEnderecoQueries(null)).toEqual([]);
  });

  it('devolve lista vazia quando nao ha logradouro nem municipio que localize', () => {
    expect(estabelecimentoEnderecoQueries(enderecoReal({ logradouro: null, municipio: null }))).toEqual([]);
  });
});
