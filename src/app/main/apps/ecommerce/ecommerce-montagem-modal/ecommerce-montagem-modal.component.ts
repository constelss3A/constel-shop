import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { EcommerceService } from "app/main/apps/ecommerce/ecommerce.service";

@Component({
  selector: "app-ecommerce-montagem-modal",
  templateUrl: "./ecommerce-montagem-modal.component.html",
  styleUrls: ["./ecommerce-montagem-modal.component.scss"],
  encapsulation: ViewEncapsulation.None,
  host: { class: "ecommerce-application" },
})
export class EcommerceMontagemModalComponent implements OnInit {
  // public
  public product: any;
  public wishlist: any;
  public cartList: any;
  public relatedProducts: any;
  public totalFormatado: string = "R$ 0,00";
  public itensSelecionadosMap: Map<any, any> = new Map();

  // Input Decorator
  @Input()
  modal: any;

  // @Input()
  // produto: any;

  quantidade: number = 1;

  valorComposicao: number = 0.0;

  produto: any = {
    _id: "69ca6f02581bd04571f4bc9b",
    id: "75a2d9da-7799-412c-9608-ef17b539963d",
    __v: 0,
    codigo: "0009",
    composicaoGrupos: [
      {
        id: "c1d940c3-b8d1-419c-9d70-48dc5752a4f7",
        inclusao: "2026-04-28T14:54:50.654Z",
        edicao: "2026-04-28T14:54:50.654Z",
        exclusao: null,
        versao: 1,
        situacao: 1,
        nome: "Burger",
        ordem: 1,
        tipo: 10,
        minimo: 0,
        maximo: 2,
        valor: 10,
        composicaoGrupoItens: [
          {
            id: "5db7680c-9dda-43d7-841e-aee04b1d563f",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "646a3764-0fa1-4b6f-89ac-3e197088cf50",
              codigo: "0001",
              nome: "x - Burger",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
          {
            id: "b0b8dd04-2ccf-4c58-996d-6136dff83f9c",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "1ce403e1-36cf-4a8b-83a3-81277d3258b9",
              codigo: "0002",
              nome: "Bacon Burger",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
          {
            id: "63d972c1-0cc2-4edf-9ca5-e57795602a9b",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "bc65d32e-f025-4846-ac7a-f54175f2d3bc",
              codigo: "0003",
              nome: "Bacon Burger Duplo",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
          {
            id: "04fc1288-8c70-4603-b11f-8989ea8e4e4c",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "eecfd7a3-f075-4d5a-8430-1365fb8f0c28",
              codigo: "0014",
              nome: "Bacon Burger Triplo",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
        ],
      },
      {
        id: "8edd0ce5-4443-4067-9b74-a87b0dca9d4a",
        inclusao: "2026-04-28T14:54:50.654Z",
        edicao: "2026-04-28T14:54:50.654Z",
        exclusao: null,
        versao: 1,
        situacao: 1,
        nome: "Refrigerante",
        ordem: 2,
        tipo: 10,
        minimo: 0,
        maximo: 1,
        valor: 20,
        composicaoGrupoItens: [
          {
            id: "2e217ef1-4f68-469d-99bc-adf177127c7b",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "3be77e39-d35f-4e06-ad0f-3cf7beeb3693",
              codigo: "4141",
              nome: "Coca Cola",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
          {
            id: "69cd9239-b0ec-4575-aef8-16a70ab8ae30",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "c5025642-105f-499b-be66-c3aead8a27da",
              codigo: "0043",
              nome: "Fanta Laranja",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
          {
            id: "5bad9480-9039-426f-9c1b-8a834ba340fe",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "02d3b2ee-4e77-4423-a4b3-be5d2f759598",
              codigo: "0044",
              nome: "Fanta Uva",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
          {
            id: "6419a4d0-590f-43fc-a46b-4b260e863c75",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "309b6095-faad-48ee-8b40-04af2d758b45",
              codigo: "00040",
              nome: "Guaraná Antarctica",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
        ],
      },
      {
        id: "d21f4ab3-40d9-4708-a9fa-1b30d42921e3",
        inclusao: "2026-04-28T14:54:50.654Z",
        edicao: "2026-04-28T14:54:50.654Z",
        exclusao: null,
        versao: 1,
        situacao: 1,
        nome: "Fritas",
        ordem: 3,
        tipo: 10,
        minimo: 0,
        maximo: 1,
        valor: 10,
        composicaoGrupoItens: [
          {
            id: "1e979717-0fcb-49ae-b18e-735c3093997a",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "e846afdc-d2a6-4624-a950-674b434798e5",
              codigo: "0008",
              nome: "Batata Frita",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
          {
            id: "2ca57494-fd76-43cf-95c4-0e1b1cd2217d",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "fe3ceb30-f784-4834-ae43-12da14ac53a7",
              codigo: "105126",
              nome: "Batata especial",
            },
            unidade: {
              id: "6539cfa9-5869-4c0d-b368-be6e4f5fe886",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: false,
          },
        ],
      },
      {
        id: "679e7fb0-8830-4e4a-98ab-8f3cc62dab13",
        inclusao: "2026-04-28T14:54:50.654Z",
        edicao: "2026-04-28T14:54:50.654Z",
        exclusao: null,
        versao: 1,
        situacao: 1,
        nome: "Sobremesa",
        ordem: 4,
        tipo: 20,
        minimo: 0,
        maximo: 1,
        valor: 0,
        composicaoGrupoItens: [
          {
            id: "41d2cd4f-9887-4943-b512-69000349e4f1",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "d3f605c9-ecd9-46e5-94f9-863441257554",
              codigo: "0052",
              nome: "Café Extra Forte",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 5,
            imprimir: true,
          },
          {
            id: "8b520f0c-224d-4385-95ae-c0cfab0843fe",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "40ae8226-682a-4317-a900-05e4fd701a1d",
              codigo: "0050",
              nome: "Café Suíço",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 13.99,
            imprimir: true,
          },
        ],
      },
      {
        id: "7e690ef7-d59d-49ae-8f9f-e68e2b91227a",
        inclusao: "2026-04-28T14:54:50.654Z",
        edicao: "2026-04-28T14:54:50.654Z",
        exclusao: null,
        versao: 1,
        situacao: 1,
        nome: "Suco",
        ordem: 5,
        tipo: 10,
        minimo: 0,
        maximo: 1,
        valor: 2.99,
        composicaoGrupoItens: [
          {
            id: "f2538c7e-8318-4d2e-95d0-e57fd4bbeb0c",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "21be66ad-672b-4485-8356-ffb7a6bcf6a1",
              codigo: "0035",
              nome: "Suco de Laranja",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: false,
          },
          {
            id: "75394161-619d-4846-8ae2-6935edc7ad66",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "aa8e2b29-6c22-4472-be6b-54a8778f227e",
              codigo: "0030",
              nome: "Suco de Abacaxi",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: true,
          },
          {
            id: "c2648f93-70f7-457d-9d92-f1f8ba494d38",
            inclusao: "2026-04-28T14:54:50.654Z",
            edicao: "2026-04-28T14:54:50.654Z",
            exclusao: null,
            versao: 1,
            situacao: 1,
            item: {
              id: "e6916b85-5c02-4cf8-88ae-1820079502d4",
              codigo: "105181",
              nome: "Suco de Acerola",
            },
            unidade: {
              id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
              codigo: "UN",
              nome: "Unidade",
            },
            quantidade: 1,
            quantidadeAtual: 0,
            fator: 1,
            valor: 0,
            imprimir: false,
          },
        ],
      },
    ],
    composicaoInsumos: [],
    edicao: "2026-04-28T14:54:50.645Z",
    exclusao: null,
    fator: 1,
    inclusao: "2023-05-08T00:51:26.408Z",
    item: {
      id: "cd78f2fa-c3c6-4fce-8cca-69504763142f",
      imagem:
        "https://s3.amazonaws.com/atlas.constel.cloud/files/79c3a27b-b045-44bb-ae60-68c6c3eb3fa8.png",
      codigo: "0009",
      nome: "Combo Durango",
    },
    situacao: 1,
    tipo: 10,
    unidade: {
      id: "6b5ee198-de25-4d09-8e3e-09f0ea52d62c",
      codigo: "UN",
      nome: "Unidade",
    },
    versao: 42,
  };

  /**
   * Constructor
   *
   * @param {EcommerceService} _ecommerceService
   * @param {NgbModal} _modalService
   */
  constructor(private _ecommerceService: EcommerceService) {}

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Add To Cart
   *
   * @param product
   */
  addToCart(product: any) {
    this._ecommerceService.addToCart(product.id).then((res) => {
      product.isInCart = true;
    });
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to Selected Product change
    // this._ecommerceService.onSelectedProductChange.subscribe(res => {
    //   this.product = res;
    // });

    this.product = this._ecommerceService.getProduct();

    // Subscribe to Wishlist change
    this._ecommerceService.onWishlistChange.subscribe(
      (res) => (this.wishlist = res),
    );

    // Subscribe to Cartlist change
    this._ecommerceService.onCartListChange.subscribe(
      (res) => (this.cartList = res),
    );

    // Get Related Products
    this._ecommerceService.getRelatedProducts().then((response) => {
      this.relatedProducts = response;
    });

    this.product.isInWishlist =
      this.wishlist.findIndex((p: any) => p.productId === this.product.id) > -1;
    this.product.isInCart =
      this.cartList.findIndex((p: any) => p.productId === this.product.id) > -1;
  }

  adicionar() {}

  diminuir() {
    if(this.quantidade > 1) {
      this.quantidade--;
    }
  }

  aumentar() {
    this.quantidade++;
  }

  toggleOpcao(grupo: any, grupoItem: any) {
    
  }

  diminuirItem(grupo: any, grupoItem: any) {
    if (grupoItem.quantidadeAtual == 0) {
      return;
    }
    grupoItem.quantidadeAtual--;
    this.itensSelecionadosMap.forEach((value: any, key: any) => {
      if (value === grupo && key === grupoItem) {
        key.quantidadeAtual--;
      }
    });
  }

  aumentarItem(grupo: any, grupoItem: any) {
    if (!this.itensSelecionadosMap.has(grupo)) {
      grupoItem.quantidadeAtual++;
      this.itensSelecionadosMap.set(grupo, [grupoItem]);
    } else {
      const itensSelecionados = this.itensSelecionadosMap.get(grupo);
      const quantidadeSelecionada = itensSelecionados.reduce(
        (acc: number, item: any) => acc + item.quantidadeAtual,
        0,
      );

      if (quantidadeSelecionada < grupo.maximo) {
        if (!itensSelecionados.includes(grupoItem)) {
          grupoItem.quantidadeAtual++;

          itensSelecionados.push(grupoItem);
        } else {
          grupoItem.quantidadeAtual++;
          this.itensSelecionadosMap.forEach((value: any, key: any) => {
            if (value === grupo && key === grupoItem) {
              key.quantidadeAtual++;
            }
          });
        }
      }
    }
  }

  checarQuantidadeSelecionada(grupo: any): boolean {
    if(!this.itensSelecionadosMap.has(grupo)) {
      return false;
    }
    const itensSelecionados = this.itensSelecionadosMap.get(grupo);
    const quantidadeSelecionada = itensSelecionados.reduce(
      (acc: number, item: any) => acc + item.quantidadeAtual,
      0,
    );
    return quantidadeSelecionada >= grupo.maximo;
  }
}
