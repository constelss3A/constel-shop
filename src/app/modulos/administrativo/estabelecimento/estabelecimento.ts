export class Estabelecimento {
  id: string;
  codigo: string;
  nome: string;
  situacao: number;
  estabelecimentoEnderecos: EstabelecimentoEndereco[];
}

// Diferente do Endereco do cliente: `cep` vem formatado ("70.747-030"), `numero` vem como
// number, e `uf`/`municipio` sao entidades.
export type EstabelecimentoEndereco = {
  id: string;
  nome: string;
  favorito: boolean;
  entrega: boolean;
  retirada: boolean;
  cep: string;
  logradouro: string;
  numero: number;
  complemento: string;
  bairro: string;
  uf: { codigo: string; nome: string; sigla: string };
  municipio: { codigo: string; nome: string };
  referencia: string;
};

// O backend marca o proposito de cada endereco, entao a origem e escolhida por proposito e
// nao pela ordem da lista.
export function estabelecimentoEnderecoOrigem(estabelecimento: Estabelecimento): EstabelecimentoEndereco | null {
  const enderecos = (estabelecimento?.estabelecimentoEnderecos || []).filter(localizavel);
  return enderecos.find(endereco => endereco.entrega)
    || enderecos.find(endereco => endereco.favorito)
    || enderecos[0]
    || null;
}

// Buscas da mais precisa para a mais generica; quem chama para na primeira que responder.
//
// Nao tente consertar o logradouro aqui. Tirar o "Bloco C" de "Quadra SQN 308 Bloco C" faz
// a busca casar com a quadra 408, 1,4 km fora, e o geocoder devolve isso sem sinal de erro.
// Um degrau que erra em silencio e pior que um degrau a menos.
export function estabelecimentoEnderecoQueries(endereco: EstabelecimentoEndereco): string[] {
  if (!localizavel(endereco)) {
    return [];
  }
  const regiao = [endereco.bairro, endereco.municipio?.nome, endereco.uf?.sigla, 'Brasil'].filter(Boolean);
  const municipio = [endereco.municipio?.nome, endereco.uf?.sigla, 'Brasil'].filter(Boolean);
  const queries = [
    [endereco.logradouro, endereco.numero, ...regiao],
    [endereco.logradouro, ...regiao],
    regiao,
    municipio,
  ];
  return queries
    .filter(partes => partes.filter(Boolean).length > 1)
    .map(partes => partes.filter(Boolean).join(', '))
    .filter((query, i, todas) => todas.indexOf(query) === i);
}

function localizavel(endereco: EstabelecimentoEndereco): boolean {
  return !!(endereco?.logradouro || endereco?.municipio?.nome);
}
