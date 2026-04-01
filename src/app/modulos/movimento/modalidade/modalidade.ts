export class Modalidade {
  id: string;
  codigo: string;
  nome: string;
  situacao: number;
  tipo: number;
}

export enum ModalidadeSituacao {
  Ativa = 1,
  Suspensa = 40,
  Desativada = 90,
}

export enum ModalidadeTipo {
  Balcao = 10,
  Autoatendimento = 12,
  Orcamento = 20,
  DAV = 50,
  PreVenda = 60,
  OnLine = 70,
  Agrupamento = 90,
  Mesa = 110,
  Cartao = 120,
  DriveThru = 130,
  Delivery = 210,
  Encomenda = 220,
}