// O localizador e opcional porque a ausencia dele E o modo delivery: exigi-lo aqui deixa o
// cliente de entrega preso no checkout.
export function cardapioRota(
  empresaId: string,
  estabelecimentoId: string,
  localizadorId?: string,
): string[] | null {
  if (!empresaId || !estabelecimentoId) {
    return null;
  }
  const rota = ['/apps/e-commerce/shop', empresaId, estabelecimentoId];
  if (localizadorId) {
    rota.push(localizadorId);
  }
  return rota;
}
