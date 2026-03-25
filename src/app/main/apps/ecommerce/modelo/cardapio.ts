export type CardapioItem = {
  id: string;
  nome: string;
  descricao: string;
  fracionamento: boolean;
  valor: number;
  imagem?: string;
}

export type CardapioCategoria = {
  id: number;
  nome: string;
  imagem?: string;
  itens: CardapioItem[];
}

export type Cardapio = {
  categorias: CardapioCategoria[];
}