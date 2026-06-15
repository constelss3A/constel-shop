import {
  Coordenada, TaxaArredondamento, TaxaEntregaConfig, TaxaTipo,
} from './taxa-entrega';

const toRad = (g: number): number => (g * Math.PI) / 180;
const round2 = (n: number): number => Math.round(n * 100) / 100;

export type TaxaResultado = {
  dentroDaArea: boolean;
  valor: number;
  distanciaKm?: number;
  bairro?: string;
};

export function haversineKm(a: Coordenada, b: Coordenada): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function pontoNoPoligono(ponto: Coordenada, poligono: Coordenada[]): boolean {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const xi = poligono[i].longitude;
    const yi = poligono[i].latitude;
    const xj = poligono[j].longitude;
    const yj = poligono[j].latitude;
    const intersecta = ((yi > ponto.latitude) !== (yj > ponto.latitude)) &&
      (ponto.longitude < ((xj - xi) * (ponto.latitude - yi)) / (yj - yi) + xi);
    if (intersecta) {
      dentro = !dentro;
    }
  }
  return dentro;
}

function aplicaFreteGratis(config: TaxaEntregaConfig, subtotal: number, resultado: TaxaResultado): TaxaResultado {
  if (resultado.dentroDaArea && config.freteGratisAcimaDe > 0 && subtotal >= config.freteGratisAcimaDe) {
    return { ...resultado, valor: 0 };
  }
  return resultado;
}

function calculaFixo(config: TaxaEntregaConfig): TaxaResultado {
  return { dentroDaArea: true, valor: round2(config.valor) };
}

function calculaRaio(config: TaxaEntregaConfig, destino: Coordenada): TaxaResultado {
  const dist = haversineKm(config.origem, destino);
  const faixas = [...config.faixasRaio].sort((a, b) => a.raioKm - b.raioKm);
  for (const f of faixas) {
    if (dist <= f.raioKm) {
      return { dentroDaArea: true, valor: f.gratis ? 0 : round2(f.valor), distanciaKm: dist };
    }
  }
  return { dentroDaArea: false, valor: 0, distanciaKm: dist };
}

function calculaDinamica(config: TaxaEntregaConfig, destino: Coordenada): TaxaResultado {
  const dist = haversineKm(config.origem, destino);
  if (config.modoFaixa) {
    const faixas = [...config.faixasDinamica].sort((a, b) => a.ateKm - b.ateKm);
    for (const f of faixas) {
      if (dist <= f.ateKm) {
        return { dentroDaArea: true, valor: round2(f.valor), distanciaKm: dist };
      }
    }
    return { dentroDaArea: false, valor: 0, distanciaKm: dist };
  }
  if (dist > config.kmMaximo) {
    return { dentroDaArea: false, valor: 0, distanciaKm: dist };
  }
  let kmExcedente = Math.max(0, dist - config.kmBase);
  if (config.arredondamento === TaxaArredondamento.PorKmCheio) {
    kmExcedente = Math.ceil(kmExcedente);
  }
  const valor = config.valorBase + kmExcedente * config.valorPorKm;
  return { dentroDaArea: true, valor: round2(valor), distanciaKm: dist };
}

function calculaBairro(config: TaxaEntregaConfig, destino: Coordenada): TaxaResultado {
  for (const b of config.bairros) {
    if (b.ativo && pontoNoPoligono(destino, b.poligono)) {
      return { dentroDaArea: true, valor: round2(b.valor), bairro: b.nome };
    }
  }
  return { dentroDaArea: false, valor: 0 };
}

function aplicaPico(config: TaxaEntregaConfig, resultado: TaxaResultado): TaxaResultado {
  if (config.picoAtivo && resultado.dentroDaArea && config.picoMultiplicador > 0) {
    return { ...resultado, valor: round2(resultado.valor * config.picoMultiplicador) };
  }
  return resultado;
}

export function taxaEntregaCalcula(config: TaxaEntregaConfig, destino: Coordenada, subtotal: number): TaxaResultado {
  // Entrega gratis: sempre 0, ignora faixas, fora de area e pico.
  if (config.entregaGratis) {
    return { dentroDaArea: true, valor: 0 };
  }
  let resultado: TaxaResultado;
  switch (config.tipo) {
    case TaxaTipo.Fixo: resultado = calculaFixo(config); break;
    case TaxaTipo.Dinamica: resultado = calculaDinamica(config, destino); break;
    case TaxaTipo.Bairro: resultado = calculaBairro(config, destino); break;
    case TaxaTipo.Raio: resultado = calculaRaio(config, destino); break;
    default: resultado = { dentroDaArea: false, valor: 0 };
  }
  // Pico multiplica o frete calculado; o gratis-acima-de-X tem prioridade (zera antes).
  resultado = aplicaFreteGratis(config, subtotal, resultado);
  return aplicaPico(config, resultado);
}
