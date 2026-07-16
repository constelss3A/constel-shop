import { TrocoMotivo, trocoCalcula } from './pagamento';

describe('trocoCalcula', () => {
  it('devolve o troco quando o valor cobre o total', () => {
    const r = trocoCalcula(100, 55);
    expect(r.valido).toBe(true);
    expect(r.troco).toBe(45);
  });

  it('aceita valor exatamente igual ao total, com troco zero', () => {
    const r = trocoCalcula(55, 55);
    expect(r.valido).toBe(true);
    expect(r.troco).toBe(0);
  });

  it('recusa valor menor que o total', () => {
    const r = trocoCalcula(50, 55);
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe(TrocoMotivo.Insuficiente);
    expect(r.troco).toBe(0);
  });

  it('trata valor nao informado como pendente, nao como insuficiente', () => {
    for (const vazio of [null, undefined, 0, NaN]) {
      const r = trocoCalcula(vazio as number, 55);
      expect(r.valido).toBe(false);
      expect(r.motivo).toBe(TrocoMotivo.NaoInformado);
    }
  });

  it('recusa valor negativo', () => {
    const r = trocoCalcula(-10, 55);
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe(TrocoMotivo.NaoInformado);
  });

  // 100 - 55.30 em ponto flutuante da 44.699999999999996; o cliente nao pode ver isso.
  it('arredonda o centavo, sem vazar ponto flutuante', () => {
    expect(trocoCalcula(100, 55.30).troco).toBe(44.70);
    expect(trocoCalcula(50, 19.99).troco).toBe(30.01);
    expect(trocoCalcula(20, 0.10).troco).toBe(19.90);
  });

  it('funciona com total zero', () => {
    const r = trocoCalcula(20, 0);
    expect(r.valido).toBe(true);
    expect(r.troco).toBe(20);
  });

  // Se o frete subir depois que o cliente informou o troco, o valor que era suficiente
  // deixa de ser - e a tela precisa saber disso na hora, nao so no finalizar.
  it('vira invalido quando o total sobe acima do valor informado', () => {
    expect(trocoCalcula(60, 55).valido).toBe(true);
    expect(trocoCalcula(60, 62).valido).toBe(false);
  });
});
