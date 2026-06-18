import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";

import { EcommerceService } from "app/main/apps/ecommerce/ecommerce.service";
import {
  ComposicaoGrupo,
  ComposicaoGrupoItem,
  ComposicaoTipo,
  Item,
  ItemSituacao,
} from "app/modulos/recurso/item/item";
import { CardapioItem } from "../modelo/cardapio";

@Component({
  selector: "app-ecommerce-montagem-modal",
  templateUrl: "./ecommerce-montagem-modal.component.html",
  styleUrls: ["./ecommerce-montagem-modal.component.scss"],
  encapsulation: ViewEncapsulation.None,
  host: { class: "ecommerce-application" },
})
export class EcommerceMontagemModalComponent implements OnInit {
  @Input() modal: any;
  @Input() item!: CardapioItem;

  public isLoading = true;
  public produto: Item = new Item();
  public observacoes: string = "";
  public quantidade: number = 1;

  public itensSelecionadosMap: Map<ComposicaoGrupo, ComposicaoGrupoItem[]> =
    new Map();
  private quantidadeSelecionadaMap: Map<ComposicaoGrupoItem, number> =
    new Map();

  private vendaItensComposicao: Item[] = [];

  get composicaoGrupoItens(): ComposicaoGrupoItem[] {
    const result: ComposicaoGrupoItem[] = [];
    this.itensSelecionadosMap.forEach((itens) => {
      result.push(...itens);
    });
    return result;
  }

  constructor(private _ecommerceService: EcommerceService) {}

  ngOnInit(): void {
    this._ecommerceService
      .getItemDetalhado(this.item.id)
      .toPromise()
      .then((item) => (this.produto = item))
      .finally(() => (this.isLoading = false));
  }

  get valorComposicao(): number {
    const valorBase = this.produto?.valor ?? 0;
    const valorAdicionais = this.composicaoGrupoItens.reduce(
      (acc, cgi) => acc + cgi.valor * (cgi.quantidade ?? 1),
      0,
    );
    return valorBase + valorAdicionais;
  }

  get totalFormatado(): string {
    const total = this.valorComposicao * this.quantidade;
    return `R$ ${total.toFixed(2).replace(".", ",")}`;
  }

  selecionadosNoGrupo(grupo: ComposicaoGrupo): number {
    const itens = this.itensSelecionadosMap.get(grupo) ?? [];
    return itens.reduce((acc, cgi) => {
      const qtdUsuario = this.quantidadeSelecionadaMap.get(cgi) ?? 0;
      return acc + cgi.quantidade * qtdUsuario;
    }, 0);
  }

  isItemSelecionado(grupoItem: ComposicaoGrupoItem): boolean {
    return (this.quantidadeSelecionadaMap.get(grupoItem) ?? 0) > 0;
  }

  getQuantidadeItem(grupoItem: ComposicaoGrupoItem): number {
    return this.quantidadeSelecionadaMap.get(grupoItem) ?? 0;
  }

  getFatorGrupo(grupo: ComposicaoGrupo): number {
    const fatores = new Set(grupo.composicaoGrupoItens.map(cgi => cgi.quantidade));
    return fatores.size === 1 ? [...fatores][0] : 1;
  }

  getMinimoGrupo(grupo: ComposicaoGrupo): number {
    return grupo.minimo / this.getFatorGrupo(grupo);
  }

  getMaximoGrupo(grupo: ComposicaoGrupo): number {
    return grupo.maximo / this.getFatorGrupo(grupo);
  }

  usaStepperNoGrupo(grupo: ComposicaoGrupo): boolean {
    return grupo.maximo > 1 || this.getFatorGrupo(grupo) % 1 !== 0;
  }

  toggleOpcao(grupo: ComposicaoGrupo, grupoItem: ComposicaoGrupoItem): void {
    const itens = this.itensSelecionadosMap.get(grupo) ?? [];

    if (this.isItemSelecionado(grupoItem)) {
      this.quantidadeSelecionadaMap.delete(grupoItem);
      const index = itens.indexOf(grupoItem);
      if (index >= 0) itens.splice(index, 1);
    } else {
      const pesoAtual = this.selecionadosNoGrupo(grupo);
      if (pesoAtual + grupoItem.quantidade <= grupo.maximo) {
        this.quantidadeSelecionadaMap.set(grupoItem, 1);
        if (!itens.includes(grupoItem)) itens.push(grupoItem);
      }
    }

    this.itensSelecionadosMap.set(grupo, itens);
  }

  aumentarItem(grupo: ComposicaoGrupo, grupoItem: ComposicaoGrupoItem): void {
    const pesoAtual = this.selecionadosNoGrupo(grupo);

    // Verifica se ainda cabe mais uma unidade desse item
    if (pesoAtual + grupoItem.quantidade > grupo.maximo) return;

    const itens = this.itensSelecionadosMap.get(grupo) ?? [];
    const qtdAtual = this.quantidadeSelecionadaMap.get(grupoItem) ?? 0;

    this.quantidadeSelecionadaMap.set(grupoItem, qtdAtual + 1);
    if (!itens.includes(grupoItem)) itens.push(grupoItem);

    this.itensSelecionadosMap.set(grupo, itens);
  }

  diminuirItem(grupo: ComposicaoGrupo, grupoItem: ComposicaoGrupoItem): void {
    const qtdAtual = this.quantidadeSelecionadaMap.get(grupoItem) ?? 0;
    if (qtdAtual <= 0) return;

    const novaQtd = qtdAtual - 1;
    if (novaQtd <= 0) {
      this.quantidadeSelecionadaMap.delete(grupoItem);
      const itens = this.itensSelecionadosMap.get(grupo) ?? [];
      const index = itens.indexOf(grupoItem);
      if (index >= 0) itens.splice(index, 1);
      this.itensSelecionadosMap.set(grupo, itens);
    } else {
      this.quantidadeSelecionadaMap.set(grupoItem, novaQtd);
    }
  }

  checarQuantidadeSelecionada(grupo: ComposicaoGrupo): boolean {
    return this.selecionadosNoGrupo(grupo) >= grupo.maximo;
  }

  diminuir(): void {
    if (this.quantidade > 1) this.quantidade--;
  }

  aumentar(): void {
    this.quantidade++;
  }

  async adicionar(): Promise<void> {
    try {
      await this.addComposicaoToCart();
      this.modal.close({
        quantidade: this.quantidade,
        observacoes: this.observacoes,
      });
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
    }
  }

  async addComposicaoToCart(): Promise<void> {
    const observacoes = this.observacoes.trim() || "";
    const hasGrupoObrigatorio =
      this.produto.composicao?.composicaoGrupos?.some((g) => g.minimo > 0) ??
      false;

    const itemPai: Item = {
      ...this.produto,
      quantidade: this.quantidade,
      observacoes: observacoes,
      montagemGrupo: 0,
      // composicaoItens: [...this.composicaoGrupoItens],
      // isItemComposicao: true,
      // itemPai: null,
    };

    const temItens = this.composicaoGrupoItens.length > 0;
    const semItensMasNaoObrigatorio =
      this.composicaoGrupoItens.length === 0 && !hasGrupoObrigatorio;

    if (temItens || semItensMasNaoObrigatorio) {
      const montagemBloco = this.generateMontagemBloco();
      itemPai.montagemBloco = montagemBloco;
      itemPai.montagemTipo = ComposicaoTipo.Montagem;

      await this.processItems(itemPai);

      this._ecommerceService.addComposicaoToCart(itemPai).then();

      for (const composicaoItem of this.vendaItensComposicao) {
        composicaoItem.montagemBloco = montagemBloco;
        this._ecommerceService.addComposicaoToCart(composicaoItem).then();
      }
    }
  }

  async processItems(selectedItem: Item): Promise<void> {
    const composicaoItems = this.getComposicaoItems();

    const vendaItems: any[] = composicaoItems.map((item: any) => ({
      ...item,
      itemPai: selectedItem,
    }));

    // selectedItem.subtotal = valor * quantidade (já vem assim do addComposicaoToCart)
    // Delphi: Item.Subtotal = Arredonda(Item.Valor * Item.Quantidade)
    // selectedItem.subtotal = (selectedItem.valor * this.quantidade).roundABNT(2);
    // selectedItem.total = selectedItem.subtotal;
    selectedItem.valor = (selectedItem.valor * this.quantidade).roundABNT(2);
    // selectedItem.total = selectedItem.subtotal;

    // Delphi: SubtotalOpcional = soma de SubItem.Valor onde MontagemGrupoTipo = OPCIONAL (10)

    const subtotalOpcional = vendaItems
      .filter((s) => s.montagemGrupoTipo === 10)
      .reduce((t, s) => t + s.valor, 0)
      .roundABNT(2);

    let remanescente = 0.01;

    for (const subItem of vendaItems) {
      if (subItem.valor < 0)
        throw new Error(
          "Erro no rateio dos valores: valor do subitem não informado",
        );

      // Só rateia OPCIONAL (tipo 10)
      if (subItem.montagemGrupoTipo !== 10) continue;

      if (subItem.montagemGrupoValor > 0) {
        // Delphi: se MontagemGrupoValor > 0, valor fixo do grupo
        subItem.valor = subItem.montagemGrupoValor;
      } else {
        // Delphi: Trunca(SubItem.Valor * (Item.Valor / TotalOpcional) / SubItem.Quantidade, 2) - Remanescente
        const divisor = subtotalOpcional > 0 ? subtotalOpcional : 1;
        let novoValor =
          (subItem.valor * (selectedItem.valor / divisor)) /
          (subItem.quantidade ?? 1);
        novoValor = novoValor.roundABNT(2) - remanescente;
        subItem.valor = novoValor.roundABNT(2);
        remanescente = 0;
      }

      subItem.subtotal = (subItem.valor * (subItem.quantidade ?? 1)).roundABNT(
        2,
      );
      subItem.total = subItem.subtotal;

      if (subItem.valor <= 0)
        throw new Error(
          "Erro no rateio dos valores: valor remanescente negativo",
        );
    }

    // Delphi: Subtotal = Item.Subtotal - soma dos SubItem.Subtotal onde OPCIONAL
    // let subtotal = selectedItem.subtotal!;
    let subtotal = selectedItem.valor!;
    for (const sub of vendaItems) {
      if (sub.montagemGrupoTipo === 10) {
        subtotal = (subtotal - sub.subtotal).roundABNT(2);
      }
    }

    // Delphi: Item.Valor = Trunca(Subtotal / Item.Quantidade)
    selectedItem.valor = subtotal.roundABNT(2) / this.quantidade;
    // selectedItem.subtotal = (selectedItem.valor * this.quantidade).roundABNT(2);
    // selectedItem.total = selectedItem.subtotal;

    if (selectedItem.valor <= 0) throw new Error("Erro no rateio dos valores");

    this.vendaItensComposicao = vendaItems;
  }

  getComposicaoItems(): any[] {
    const grupos = this.produto?.composicao?.composicaoGrupos ?? [];
    const items: any[] = [];
    let globalIndex = 0;

    for (const grupo of grupos) {
      // Tipo OBSERVACAO (20 no Delphi = COMPOSICAOGRUPO_TIPO_OBSERVACAO) — pula
      // Baseado no Delphi: só processa se tipo != OBSERVACAO e tem itens
      if (grupo.composicaoGrupoItens.length === 0) {
        globalIndex++;
        continue;
      }

      for (const cgi of grupo.composicaoGrupoItens) {
        const selecionados = this.itensSelecionadosMap.get(grupo) ?? [];

        if (!selecionados.includes(cgi)) {
          globalIndex++;
          continue;
        }

        const qtdUsuario = this.quantidadeSelecionadaMap.get(cgi) ?? 1;
        const quantidadeReal = cgi.quantidade * qtdUsuario;

        // ADICIONAL (tipo 20): Valor = cgi.valor (valor do próprio item)
        // OPCIONAL (tipo 10): se grupo.valor > 0 usa grupo.valor, senão busca preço do item
        // MANDATORIO (tipo 30): Valor = 0
        let valor = 0;
        if (grupo.tipo === 20) {
          // ADICIONAL — valor fixo do cgi
          valor = cgi.valor;
        } else if (grupo.tipo === 10) {
          // OPCIONAL — valor do grupo se existir
          valor = grupo.valor > 0 ? grupo.valor : cgi.valor;
        } else {
          // MANDATORIO ou outros — valor 0
          valor = 0;
        }

        items.push({
          id: cgi.item.id,
          codigo: cgi.item.codigo,
          // imagem: cgi.item.imagem,
          nome: cgi.item.nome,
          valor: valor,
          quantidade: quantidadeReal,
          quantidadeNova: quantidadeReal * this.quantidade,
          composicaoGrupo: grupo,
          montagemGrupoTipo: grupo.tipo,
          montagemGrupoValor: grupo.valor,
          montagemGrupo: grupo.ordem * 1000 + (globalIndex % 1000),
          montagemTipo: 20, // ITEM_MONTAGEMTIPO_SUBITEM
          // unidade: cgi.item.unidade ?? cgi.unidade,
          // fracionamento: cgi.item.fracionamento ?? false,
          // medida: cgi.item.medida,
          subtotal: (valor * (quantidadeReal ?? 1)).roundABNT(2),
          total: (valor * (quantidadeReal ?? 1)).roundABNT(2),
          composicaoItens: [],
          isItemComposicao: true,
          itemPai: null, // será setado no processItems
        });

        globalIndex++;
      }
    }

    return items;
  }

  generateMontagemBloco(): string {
    const timestampUnix = Math.floor(Date.now() / 1000);
    const guid = crypto
      .randomUUID()
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 8)
      .toUpperCase();
    return `${timestampUnix}${guid}`;
  }
}
