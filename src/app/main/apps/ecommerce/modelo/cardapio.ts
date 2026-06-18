import { ComposicaoGrupoTipo, ComposicaoTipo } from "app/modulos/recurso/item/item";

export type CardapioItem = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  fracionamento: boolean;
  valor: number;
  imagem?: string;
  montagem: boolean;
  montagemTipo?: ComposicaoTipo | null;
  montagemGrupoTipo?: ComposicaoGrupoTipo | null;
  montagemBloco?: string;
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