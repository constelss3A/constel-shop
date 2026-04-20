import { BaseEmpresa } from 'app/modulos/base';
import { Categoria } from '../categoria/categoria';
import { Unidade } from '../unidade/unidade';

export class Item extends BaseEmpresa {
  codigo: string;
  nome: string;
  descricao: string;
  situacao: ItemSituacao;
  medida: string;
  imagem: string;
  atributos: string[];
  favorito: boolean;
  estrela: boolean;
  fracionamento: boolean;
  ordem: number | null;
  categoria: Categoria;
  tipo = ItemTipo.Produto;
  valor: number;
  promocao: string;
  montagem: boolean;
  categoriaCodigo: string;
  alergenos: number[];
  composicao?: Composicao;
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

export class ItemC extends BaseEmpresa {
  codigo: string;
  nome: string;
}

export class Composicao extends BaseEmpresa {
  codigo: string;
  situacao: ComposicaoSituacao;
  tipo: ComposicaoTipo;
  item: ItemC;
  unidade: Unidade;
  fator: number;
  observacoes: string;
  composicaoGrupos: ComposicaoGrupo[];
  composicaoObservacoes: ComposicaoObservacao[];
}

export enum ComposicaoSituacao {
  Ativa = 1,
  Suspensa = 50,
  Desativada = 90,
}

export enum ComposicaoTipo {
  Montagem = 10,
  Insumo = 20,
  Beneficiamento = 30,
  Fabricacao = 40,
}

export enum ComposicaoAcao {
  Incluir = 10,
  //Editar = 20,
  Excluir = 30,
}

export class ComposicaoGrupo {
  situacao: ComposicaoSituacao;
  nome: string;
  tipo: ComposicaoGrupoTipo;
  ordem: number;
  minimo: number;
  maximo: number;
  valor: number;
  composicaoGrupoItens: ComposicaoGrupoItem[];
}

export enum ComposicaoGrupoTipo {
  Acompanhamento = 5,
  Opcional = 10,
  Adicional = 20,
  Complemento = 30,
}

export class ComposicaoGrupoItem {
  situacao: ComposicaoSituacao;
  item: ItemC;
  unidade: Unidade;
  quantidade: number;
  fator: number;
  minimo: number;
  maximo: number;
  valor: number;
  imprimir: boolean;
}

export class ComposicaoObservacao {
  situacao: ComposicaoSituacao;
  nome: string;
  acao: ComposicaoAcao;
  item: ItemC;
}