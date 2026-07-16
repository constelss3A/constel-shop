import { cepDigitos, cepFormata, cepValido } from './endereco';

describe('cepDigitos', () => {
  it('tira mascara, espaco e qualquer letra', () => {
    expect(cepDigitos('60160-230')).toBe('60160230');
    expect(cepDigitos('60.160-230')).toBe('60160230');
    expect(cepDigitos(' 60160 230 ')).toBe('60160230');
    expect(cepDigitos('60160abc230')).toBe('60160230');
  });

  it('nao estoura com nulo nem vazio', () => {
    expect(cepDigitos(null)).toBe('');
    expect(cepDigitos('')).toBe('');
  });

  // O estabelecimento vem do backend com o CEP mascarado ("70.747-030"); o cliente digita
  // solto. Os dois passam por aqui e viram a mesma coisa.
  it('normaliza o cep mascarado que o backend manda', () => {
    expect(cepDigitos('70.747-030')).toBe('70747030');
  });
});

describe('cepFormata', () => {
  it('nao poe hifen antes de ter cinco digitos', () => {
    expect(cepFormata('6')).toBe('6');
    expect(cepFormata('6016')).toBe('6016');
    expect(cepFormata('60160')).toBe('60160');
  });

  it('poe o hifen a partir do sexto digito', () => {
    expect(cepFormata('601602')).toBe('60160-2');
    expect(cepFormata('60160230')).toBe('60160-230');
  });

  it('descarta o que passar de oito digitos', () => {
    expect(cepFormata('601602309999')).toBe('60160-230');
  });

  it('reformata um cep que ja vem com mascara, sem duplicar hifen', () => {
    expect(cepFormata('60160-230')).toBe('60160-230');
    expect(cepFormata('70.747-030')).toBe('70747-030');
  });

  it('ignora letras que o usuario digitar', () => {
    expect(cepFormata('60160abc')).toBe('60160');
  });

  it('nao estoura com nulo nem vazio', () => {
    expect(cepFormata(null)).toBe('');
    expect(cepFormata('')).toBe('');
  });

  // Apagar tem que funcionar: se formatar o texto encurtado devolvesse o hifen, o cursor
  // ficaria preso e o usuario nao conseguiria apagar o sexto digito.
  it('solta o hifen quando o usuario apaga ate cinco digitos', () => {
    expect(cepFormata('60160-')).toBe('60160');
  });
});

describe('cepValido', () => {
  it('so aceita oito digitos', () => {
    expect(cepValido('60160230')).toBe(true);
    expect(cepValido('60160-230')).toBe(true);
    expect(cepValido('6016023')).toBe(false);
    expect(cepValido('601602300')).toBe(false);
    expect(cepValido('')).toBe(false);
    expect(cepValido(null)).toBe(false);
  });
});
