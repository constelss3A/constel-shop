import {
  Coordenada, TaxaArredondamento, TaxaEntregaConfig, TaxaTipo,
} from './taxa-entrega';
import { haversineKm, pontoNoPoligono, taxaEntregaCalcula } from './taxa-entrega-calculo';

function configBase(): TaxaEntregaConfig {
  return {
    tipo: TaxaTipo.Fixo, origem: { latitude: 0, longitude: 0 }, freteGratisAcimaDe: 0,
    entregaGratis: false, picoAtivo: false, picoMultiplicador: 1.5,
    valor: 6, valorBase: 5, kmBase: 2, valorPorKm: 1.5, kmMaximo: 10,
    arredondamento: TaxaArredondamento.PorKm, modoFaixa: false, faixasDinamica: [],
    faixasRaio: [{ raioKm: 2, valor: 5 }, { raioKm: 5, valor: 8 }], bairros: [],
  };
}
const origem: Coordenada = { latitude: 0, longitude: 0 };

describe('taxaEntregaCalcula - Entrega gratis e Pico', () => {
  it('entrega gratis zera o frete e mantem dentro da area', () => {
    const c = { ...configBase(), entregaGratis: true };
    const r = taxaEntregaCalcula(c, origem, 0);
    expect(r.dentroDaArea).toBe(true);
    expect(r.valor).toBe(0);
  });
  it('pico multiplica o frete calculado', () => {
    const c = { ...configBase(), picoAtivo: true, picoMultiplicador: 1.5 };
    const r = taxaEntregaCalcula(c, origem, 0); // Fixo = 6 * 1.5
    expect(r.valor).toBe(9);
  });
  it('entrega gratis tem prioridade sobre o pico', () => {
    const c = { ...configBase(), entregaGratis: true, picoAtivo: true, picoMultiplicador: 2 };
    expect(taxaEntregaCalcula(c, origem, 0).valor).toBe(0);
  });
});

describe('haversineKm', () => {
  it('zero para o mesmo ponto', () => {
    expect(haversineKm(origem, origem)).toBeCloseTo(0, 5);
  });
  it('aproxima 111 km por grau de latitude', () => {
    expect(haversineKm(origem, { latitude: 1, longitude: 0 })).toBeCloseTo(111.19, 0);
  });
});

describe('pontoNoPoligono', () => {
  const quadrado: Coordenada[] = [
    { latitude: 0, longitude: 0 }, { latitude: 0, longitude: 2 },
    { latitude: 2, longitude: 2 }, { latitude: 2, longitude: 0 },
  ];
  it('dentro', () => {
    expect(pontoNoPoligono({ latitude: 1, longitude: 1 }, quadrado)).toBe(true);
  });
  it('fora', () => {
    expect(pontoNoPoligono({ latitude: 3, longitude: 3 }, quadrado)).toBe(false);
  });
});

describe('taxaEntregaCalcula - Fixo', () => {
  it('retorna valor fixo', () => {
    const r = taxaEntregaCalcula(configBase(), origem, 20);
    expect(r.dentroDaArea).toBe(true);
    expect(r.valor).toBe(6);
  });
  it('frete gratis acima do limite', () => {
    const c = { ...configBase(), freteGratisAcimaDe: 50 };
    expect(taxaEntregaCalcula(c, origem, 60).valor).toBe(0);
  });
});

describe('taxaEntregaCalcula - Raio', () => {
  it('cai na primeira faixa', () => {
    const c = { ...configBase(), tipo: TaxaTipo.Raio };
    const r = taxaEntregaCalcula(c, { latitude: 0.01, longitude: 0 }, 0);
    expect(r.valor).toBe(5);
  });
  it('fora da ultima faixa = fora de area', () => {
    const c = { ...configBase(), tipo: TaxaTipo.Raio };
    const r = taxaEntregaCalcula(c, { latitude: 1, longitude: 0 }, 0);
    expect(r.dentroDaArea).toBe(false);
  });
});

describe('taxaEntregaCalcula - Dinamica continua', () => {
  it('valor base cobre o km base', () => {
    const c = { ...configBase(), tipo: TaxaTipo.Dinamica };
    const r = taxaEntregaCalcula(c, { latitude: 0.009, longitude: 0 }, 0); // ~1 km
    expect(r.valor).toBe(5);
  });
  it('soma por km excedente', () => {
    const c = { ...configBase(), tipo: TaxaTipo.Dinamica };
    const r = taxaEntregaCalcula(c, { latitude: 0.036, longitude: 0 }, 0); // ~4 km => 2 km excedente
    expect(r.valor).toBeCloseTo(8, 1); // 5 + 2*1.5
  });
  it('fora do km maximo = fora de area', () => {
    const c = { ...configBase(), tipo: TaxaTipo.Dinamica };
    const r = taxaEntregaCalcula(c, { latitude: 1, longitude: 0 }, 0);
    expect(r.dentroDaArea).toBe(false);
  });
});

describe('taxaEntregaCalcula - Dinamica PorKmCheio', () => {
  it('arredonda km excedente fracionado para cima', () => {
    const c: TaxaEntregaConfig = {
      ...configBase(),
      tipo: TaxaTipo.Dinamica,
      valorBase: 5, kmBase: 2, valorPorKm: 1.5,
      arredondamento: TaxaArredondamento.PorKmCheio,
    };
    // latitude 0.0315 => 0.0315 * 111.19 ~ 3.5 km; km excedente = 1.5 -> ceil = 2 -> 5 + 2*1.5 = 8
    const r = taxaEntregaCalcula(c, { latitude: 0.0315, longitude: 0 }, 0);
    expect(r.dentroDaArea).toBe(true);
    expect(r.valor).toBeCloseTo(8, 1);
  });
});

describe('taxaEntregaCalcula - Bairro', () => {
  it('usa o valor do bairro que contem o ponto', () => {
    const c: TaxaEntregaConfig = {
      ...configBase(), tipo: TaxaTipo.Bairro,
      bairros: [{
        id: 'a', nome: 'A', valor: 7, ativo: true,
        poligono: [
          { latitude: 0, longitude: 0 }, { latitude: 0, longitude: 2 },
          { latitude: 2, longitude: 2 }, { latitude: 2, longitude: 0 },
        ],
      }],
    };
    const r = taxaEntregaCalcula(c, { latitude: 1, longitude: 1 }, 0);
    expect(r.dentroDaArea).toBe(true);
    expect(r.valor).toBe(7);
  });
});
