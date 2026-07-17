import { trocoResumoTexto } from './troco-resumo';

describe('trocoResumoTexto', () => {
  it('diz que nao precisa quando o cliente tem o valor exato', () => {
    expect(trocoResumoTexto(false, null, 55)).toEqual({ texto: 'Não precisa', pendente: false });
    expect(trocoResumoTexto(false, 100, 55)).toEqual({ texto: 'Não precisa', pendente: false });
  });

  it('mostra o valor quando ele cobre o pedido', () => {
    expect(trocoResumoTexto(true, 100, 55)).toEqual({ texto: 'Para R$ 100,00', pendente: false });
  });

  // O buraco que isto conserta: escolher Dinheiro deixa trocoNecessario=true e o campo
  // vazio, e o resumo ficava sem linha nenhuma - um silencio bem onde falta decidir.
  it('cobra a decisao quando o cliente ainda nao informou o valor', () => {
    expect(trocoResumoTexto(true, null, 55)).toEqual({ texto: 'A informar', pendente: true });
    expect(trocoResumoTexto(true, 0, 55)).toEqual({ texto: 'A informar', pendente: true });
  });

  it('avisa quando o valor informado nao cobre o pedido', () => {
    expect(trocoResumoTexto(true, 50, 55)).toEqual({ texto: 'Valor menor que o total', pendente: true });
  });

  it('aceita valor igual ao total', () => {
    expect(trocoResumoTexto(true, 55, 55)).toEqual({ texto: 'Para R$ 55,00', pendente: false });
  });

  it('formata em real, com centavos', () => {
    expect(trocoResumoTexto(true, 100.5, 55).texto).toBe('Para R$ 100,50');
    expect(trocoResumoTexto(true, 20, 0).texto).toBe('Para R$ 20,00');
  });
});
