export enum TaxaTipo {
  Fixo = 10,
  Dinamica = 20,
  Bairro = 30,
  Raio = 40,
}

export enum TaxaArredondamento {
  PorKm = 10,
  PorKmCheio = 20,
}

export type Coordenada = { latitude: number; longitude: number };

export type TaxaFaixaRaio = { raioKm: number; valor: number; gratis?: boolean };

export type TaxaFaixaDinamica = { ateKm: number; valor: number };

export type TaxaBairro = {
  id: string;
  nome: string;
  valor: number;
  ativo: boolean;
  poligono: Coordenada[];
};

export type TaxaEntregaConfig = {
  tipo: TaxaTipo;
  origem: Coordenada;
  freteGratisAcimaDe: number;
  entregaGratis: boolean;
  picoAtivo: boolean;
  picoMultiplicador: number;

  // Fixo
  valor: number;

  // Dinamica
  valorBase: number;
  kmBase: number;
  valorPorKm: number;
  kmMaximo: number;
  arredondamento: TaxaArredondamento;
  modoFaixa: boolean;
  faixasDinamica: TaxaFaixaDinamica[];

  // Raio
  faixasRaio: TaxaFaixaRaio[];

  // Bairro
  bairros: TaxaBairro[];
};

export function taxaEntregaConfigPadrao(): TaxaEntregaConfig {
  return {
    tipo: TaxaTipo.Raio,
    origem: { latitude: -3.7320514, longitude: -38.5013204 },
    freteGratisAcimaDe: 0.00,
    entregaGratis: false,
    picoAtivo: false,
    picoMultiplicador: 1.5,
    valor: 0.00,
    valorBase: 5.00,
    kmBase: 2.0,
    valorPorKm: 1.50,
    kmMaximo: 10.0,
    arredondamento: TaxaArredondamento.PorKm,
    modoFaixa: false,
    faixasDinamica: [],
    faixasRaio: [
      { raioKm: 2, valor: 5.00 },
      { raioKm: 5, valor: 8.00 },
      { raioKm: 10, valor: 12.00 },
    ],
    bairros: [],
  };
}
