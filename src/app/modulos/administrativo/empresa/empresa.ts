export class Empresa {
  id: string;
  codigo: string;
  nome: string;
  imagem: string;
  empresaConfiguracao: {
    parametros: {
      visual: {
        cor: string;
        cardapio: {
          ativo: boolean;
          faixa: string;
        },
      },
      internet: {
        site: string;
        facebook: string;
        youtube: string;
        x: string;
      },
    },
  }
}