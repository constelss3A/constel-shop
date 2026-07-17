// Rota do cardapio. O localizador e opcional de proposito: a ausencia dele E o modo
// delivery, entao exigi-lo aqui nao deixa o cliente de entrega voltar para o cardapio.
//
// Devolve null quando nao ha contexto suficiente para navegar - quem chama nao navega.
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
