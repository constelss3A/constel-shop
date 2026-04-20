import { Cliente } from 'app/modulos/venda/localizador/cliente/cliente';
import { PedidoItem } from './pedido-item';

export class Pedido {
  id: string;
  tipo: PedidoTipo;
  empresa: {
    id: string;
    codigo: string;
    nome: string;
  };
  estabelecimento: {
    id: string;
    codigo: string;
    nome: string;
  };
  localizador: {
    id: string;
    codigo: string;
    nome: string;
    tipo: number;
  };
  referencia: string;
  modelo: PedidoModelo;
  pedidoCliente: Cliente;
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
