import { Empresa } from 'app/modulos/administrativo/empresa/empresa';
import { Estabelecimento } from 'app/modulos/administrativo/estabelecimento/estabelecimento';
import { Localizador } from 'app/modulos/venda/localizador/localizador';
import { PedidoItem } from './pedido-item';

export class Pedido {
  id: string;
  tipo: PedidoTipo;
  empresa: Empresa;
  estabelecimento: Estabelecimento;
  localizador: Localizador;
  referencia: string;
  modelo: PedidoModelo;
  pedidoItens: PedidoItem[];
  subtotal: number;
  acrescimo: number;
  frete: number;
  abatimento: number;
  desconto: number;
  total: number;
}

export enum PedidoSituacao {
  Pendente = 10,
  Autorizado = 30,
  Expedido = 40,
  Entregue = 50,
  Encerrado = 70,
  Cancelado = 90,
  Rejeitado = 91,
}

export enum PedidoTipo {
  Balcao = 10,
  Autoatendimento = 12,
  Mesa = 110,
  Comanda = 120,
  DriveThru = 130,
  Delivery = 210,
  Encomenda = 220,
}

export enum PedidoModelo {
  Constel = 10,
}
