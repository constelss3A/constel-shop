export class Localizador {
  id: string;
  codigo: string;
  nome: string;
  situacao: number;
  tipo: number;
}

export enum LocalizadorSituacao {
  Ativa = 1,
  Suspensa = 40,
  Desativada = 90,
}

export enum LocalizadorTipo {
  Mesa = 110,
  Comanda = 120,
}