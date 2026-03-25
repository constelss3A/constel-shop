import { BaseEmpresa } from 'app/modulos/base';
import { CategoriaR } from '../categoria/categoria';

export class Item extends BaseEmpresa {
  codigo: string;
  nome: string;
  descricao: string;
  imagem: string;
  situacao = ItemSituacao.Ativo;
  atributos: string[];
  estrela = false;
  categoria: CategoriaR[];
  tipo = ItemTipo.Produto;
  // ean: string;
  // unidade: UnidadeR;
  // ncm: NCMR;
  // cest: CESTR
  // fracionamento = false;
  // balanca = false;
  // estoque = true;
  // estoqueMinimo = 0.000;
  // estoqueMaximo = 0.000;
  // fabricacao: ItemFabricacao;
  // validade: number;
  // mgv: boolean;
  // lote = ItemLote.Nenhum;
  // serie = ItemSerie.Nenhum;
  // compra = true;
  // compraConta: ContaR;
  // compraOperacao: OperacaoR;
  // compraEstabelecimentoIds: string[];
  // venda = true;
  // vendaConta: ContaR;
  // vendaOperacao: OperacaoR;
  // vendaEstabelecimentoIds: string[];
  // vendaAtendimento = true;
  // vendaAutoatendimento = true;
  // vendaInternet = true;
  // comissao = true;
  // comissaoEstabelecimentoIds: string[];
  // producaoFicha = false;
  // insumos = false;
  // montagem = false;
  // acompanhamento = false;
  // favorito = false;
  // ordem = 1;
  // peso = 0.000;
  // ficha: string;
  // alergenos: number[];
  // observacoes: string;
  // precoEdita = false;
  // precoMinimo = 100;
  // precoMaximo = 100;
  // itemEstabelecimentos: ItemEstabelecimento[];
  // itemCodigos: ItemCodigo[];
  // itemPrecos: ItemPreco[];
  // itemOperacoes: ItemOperacoes[];
}

export enum ItemSituacao {
  Ativo = 1,
  Suspenso = 40,
  Desativado = 90,
}

export enum ItemTipo {
  Produto = 10,
  Insumo = 11,
  Composicao = 12,
  Fabricacao = 20,
  Beneficiamento = 30,
  Perda = 90,
  Servico = 110,
  Gorjeta = 150,
  Hora = 160,
  TaxaDeServico = 200,
  TaxaDeEntrega = 210,
}

export const ItemTipoMap = new Map<ItemTipo, string>([
  [ItemTipo.Produto, 'Produto'],
  [ItemTipo.Insumo, 'Insumo'],
  [ItemTipo.Composicao, 'Composição'],
  [ItemTipo.Fabricacao, 'Fabricação'],
  [ItemTipo.Beneficiamento, 'Beneficiamento'],
  [ItemTipo.Perda, 'Perda'],
  [ItemTipo.Servico, 'Serviço'],
  [ItemTipo.Hora, 'Hora trabalhada'],
  [ItemTipo.Gorjeta, 'Gorjeta'],
  [ItemTipo.TaxaDeServico, 'Taxa de Serviço'],
  [ItemTipo.TaxaDeEntrega, 'Taxa de Entrega'],
]);
