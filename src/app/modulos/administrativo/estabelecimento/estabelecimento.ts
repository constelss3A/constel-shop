export class Estabelecimento {
  id: string;
  codigo: string;
  nome: string;
  situacao: number;
  estabelecimentoEnderecos: EstabelecimentoEndereco[];
}

// Espelha o bloco que aps://integracao/cardapio/estabelecimento/{id} ja devolve.
// Cuidado com tres diferencas em relacao ao Endereco do cliente:
//  - `cep` vem formatado ("70.747-030"), nao em digitos crus;
//  - `numero` vem como number;
//  - `uf` e `municipio` sao entidades, nao strings.
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

// Endereco de onde as entregas saem - origem do calculo de frete.
// O backend marca o proposito de cada endereco (`entrega`, `retirada`, `favorito`, ...),
// entao a escolha e por proposito, com o favorito como desempate.
export function estabelecimentoEnderecoOrigem(estabelecimento: Estabelecimento): EstabelecimentoEndereco | null {
  const enderecos = (estabelecimento?.estabelecimentoEnderecos || []).filter(localizavel);
  return enderecos.find(endereco => endereco.entrega)
    || enderecos.find(endereco => endereco.favorito)
    || enderecos[0]
    || null;
}

// Buscas para o geocoder, da mais precisa para a mais generica. Quem chama tenta em ordem
// e para na primeira que responder.
//
// A cadeia existe porque endereco brasileiro real derruba o Nominatim: o endereco da Filial
// Brasilia ("Quadra SQN 308 Bloco C", vindo do ViaCEP) nao e encontrado, com ou sem numero.
// Buscar por CEP tambem nao resolve - o Nominatim nao indexa CEP brasileiro.
//
// Os degraus sao propositalmente poucos e grosseiros. Tentar consertar o logradouro (tirar
// "Bloco C", por exemplo) foi testado e REPROVADO: "Quadra SQN 308" casa com a quadra 408,
// 1,4 km fora, e o Nominatim devolve isso sem sinal de erro. Um degrau que erra em silencio
// e pior que um degrau a menos - por isso a cadeia degrada direto para o bairro, que erra
// por ~500 m mas erra para o lado certo.
//
// Nenhum degrau aqui e bom o suficiente para faixa de 2 km. A origem confiavel tem que vir
// do cadastro do estabelecimento (lat/lng) - ver docs/PEDIDO-ENDPOINTS-TAXA-ENTREGA.md.
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
