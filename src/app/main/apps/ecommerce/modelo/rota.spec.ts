import { cardapioRota } from './rota';

describe('cardapioRota', () => {
  it('leva o localizador quando ha um (modo mesa)', () => {
    expect(cardapioRota('e1', 'est1', 'loc1')).toEqual(['/apps/e-commerce/shop', 'e1', 'est1', 'loc1']);
  });

  // Delivery E a ausencia de localizador. Exigir um aqui foi o que quebrou o retorno ao
  // cardapio no delivery: confirmar o pedido mostrava o toast e nao saia do checkout.
  it('monta a rota sem localizador (modo delivery)', () => {
    expect(cardapioRota('e1', 'est1', null)).toEqual(['/apps/e-commerce/shop', 'e1', 'est1']);
    expect(cardapioRota('e1', 'est1', undefined)).toEqual(['/apps/e-commerce/shop', 'e1', 'est1']);
    expect(cardapioRota('e1', 'est1', '')).toEqual(['/apps/e-commerce/shop', 'e1', 'est1']);
  });

  it('devolve null sem empresa ou sem estabelecimento, que nao dao rota', () => {
    expect(cardapioRota(null, 'est1', 'loc1')).toBeNull();
    expect(cardapioRota('e1', null, 'loc1')).toBeNull();
    expect(cardapioRota('', '', '')).toBeNull();
    expect(cardapioRota(null, null, null)).toBeNull();
  });
});
