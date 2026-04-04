export type CardapioItem = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  fracionamento: boolean;
  valor: number;
  imagem?: string;
}

export type CardapioCategoria = {
  id: string;
  codigo: string;
  nome: string;
  imagem?: string;
  itens: CardapioItem[];
}

export type Cardapio = {
  categorias: CardapioCategoria[];
}