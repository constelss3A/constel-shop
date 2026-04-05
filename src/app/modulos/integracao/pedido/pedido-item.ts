import { Item } from 'app/modulos/recurso/item/item';

export class PedidoItem {
  sequencial: number;
  item: Item;
  itemIdentificador: string;
  itemNome: string;
  valor: number;
  quantidade: number;
  medida: string;
  subtotal: number;
  opcionais: number;
  total: number;
}