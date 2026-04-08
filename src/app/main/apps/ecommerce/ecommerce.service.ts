import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import { EComProduct } from './modelo/product';
import { ApiService } from 'app/modulos/api.service';
import { Cardapio } from './modelo/cardapio';
import { Empresa } from 'app/modulos/administrativo/empresa/empresa';
import { Estabelecimento } from 'app/modulos/administrativo/estabelecimento/estabelecimento';
import { Sacola, SacolaLinha } from './modelo/sacola';
import { Localizador } from 'app/modulos/venda/localizador/localizador';
import { Pedido, PedidoModelo, PedidoTipo } from 'app/modulos/integracao/pedido/pedido';
import { PedidoItem } from 'app/modulos/integracao/pedido/pedido-item';
import { Item } from 'app/modulos/recurso/item/item';
import { ToastService } from 'app/main/components/toasts/toasts.service';

@Injectable({
  providedIn: 'root'
})
export class EcommerceService implements Resolve<any> {
  // Public
  empresa: Empresa;
  estabelecimento: Estabelecimento;
  localizador: Localizador;
  sacola: Sacola;
  cardapio: Cardapio;
  productList: Array<EComProduct>;
  wishlist: Array<any>;
  cartList: Array<any>;
  selectedProduct;
  relatedProducts;

  onEmpresaChange: BehaviorSubject<any>;
  onEstabelecimentoChange: BehaviorSubject<any>;
  onLocalizadorChange: BehaviorSubject<any>;
  onCardapioChange: BehaviorSubject<any>;
  onSacolaChange: BehaviorSubject<any>;
  public onProductListChange: BehaviorSubject<any>;
  public onRelatedProductsChange: BehaviorSubject<any>;
  public onWishlistChange: BehaviorSubject<any>;
  public onCartListChange: BehaviorSubject<any>;
  public onSelectedProductChange: BehaviorSubject<any>;

  // Private
  private idHandel;
  private empresaId: string = '';
  private estabelecimentoId: string = '';
  private localizadorId: string = '';

  private sortRef = key => (a, b) => {
    const fieldA = a[key];
    const fieldB = b[key];

    let comparison = 0;
    if (fieldA > fieldB) {
      comparison = 1;
    } else if (fieldA < fieldB) {
      comparison = -1;
    }
    return comparison;
  };

  /**
   * Constructor
   *
   * @param {HttpClient} _httpClient
   */
  constructor(
    private _httpClient: HttpClient,
    private apiService: ApiService,
  ) {
    this.sacola = new Sacola();
    this.onEmpresaChange = new BehaviorSubject({});
    this.onEstabelecimentoChange = new BehaviorSubject({});
    this.onLocalizadorChange = new BehaviorSubject({});
    this.onCardapioChange = new BehaviorSubject({});
    this.onSacolaChange = new BehaviorSubject({});
    this.onProductListChange = new BehaviorSubject({});
    this.onRelatedProductsChange = new BehaviorSubject({});
    this.onWishlistChange = new BehaviorSubject({});
    this.onCartListChange = new BehaviorSubject({});
    this.onSelectedProductChange = new BehaviorSubject({});
    this.sacola.inicia();
  }

  /**
   * Resolver
   *
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    this.idHandel = route.params.id;
    this.empresaId = route.params.empresaid;
    this.estabelecimentoId = route.params.estabelecimentoid;
    this.localizadorId = route.params.localizadorid;
    this.sacola = new Sacola();
    this.onSacolaChange.next(this.sacola);
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.getEmpresa(), this.getEstabelecimento(), this.getLocalizador(), this.getCardapio(), this.getWishlist(), this.getCartList(), this.getSelectedProduct()]).then(() => {
        resolve();
      }, reject);
    });
  }

  getEmpresa(): Promise<{ ok: boolean }> {
    return new Promise((resolve, reject) => {
      this.apiService.encontra<Empresa>(`aps://integracao/cardapio/empresa/${this.empresaId}`, '').subscribe((empresa: Empresa) => {
        this.empresa = empresa;
        this.onEmpresaChange.next(empresa);
        resolve({ ok: true });
      }, reject);
    });
  }

  getEstabelecimento(): Promise<{ ok: boolean }> {
    return new Promise((resolve, reject) => {
      this.apiService.encontra<Empresa>(`aps://integracao/cardapio/estabelecimento/${this.estabelecimentoId}`, '').subscribe((estabelecimento: Estabelecimento) => {
        this.estabelecimento = estabelecimento;
        this.onEstabelecimentoChange.next(estabelecimento);
        resolve({ ok: true });
      }, reject);
    });
  }

  getLocalizador(): Promise<{ ok: boolean }> {
    if (!this.localizadorId) {
      this.localizador = null;
      return Promise.resolve({ ok: false });
    }
    return new Promise((resolve, reject) => {
      this.apiService.encontra<Localizador>(`aps://integracao/cardapio/localizador/${this.localizadorId}`, '').subscribe((localizador: Localizador) => {
        this.localizador = localizador;
        this.onLocalizadorChange.next(localizador);
        resolve({ ok: true });
      }, reject);
    });
  }

  getCardapio(): Promise<{ ok: boolean }> {
    if (!(this.empresaId && this.estabelecimentoId)) {
      return Promise.resolve({ ok: false });
    }
    return new Promise((resolve, reject) => {
      this.cardapio = {
        categorias: [],
      };
      this.apiService.encontra<Cardapio>(`aps://integracao/cardapio/menu/${this.empresaId}/${this.estabelecimentoId}`, '').subscribe((cardapio: Cardapio) => {
        const products: EComProduct[] = [];
        cardapio.categorias.forEach(categoria => {
          categoria.imagem ??= 'assets/images/ecommerce/categoria.png';
          if (categoria.nome === 'Favoritos') {
            categoria.nome = 'Destaques';
            categoria.imagem = 'assets/images/ecommerce/destaque.png';
          }
          categoria.itens.forEach(item => {
            // if (['a', 'b', 'c', '1', '2', '3'].includes(item.id.substring(2, 2).toLowerCase())) {
            //   item['valorOriginal'] = 3;
            // }
            item.imagem ??= 'assets/images/ecommerce/item.png';
            products.push({
              id: item.id,
              name: item.nome,
              slug: 'memo',
              brand: 'Geral',
              price: item.valor,
              image: item.imagem,
              hasFreeShipping: true,
              rating: 5,
              description: item.descricao,
            });
          });
        });
        this.cardapio = cardapio;
        this.productList = products;
        this.onCardapioChange.next(cardapio);
        this.onProductListChange.next(this.productList);
        resolve({ ok: true });
      }, reject);
    });
  }

  /**
   * Get Wishlist
   */
  getWishlist(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient.get('api/ecommerce-userWishlist').subscribe((response: any) => {
        this.wishlist = response;
        this.onWishlistChange.next(this.wishlist);
        resolve(this.wishlist);
      }, reject);
    });
  }

  /**
   * Get CartList
   */
  getCartList(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient.get('api/ecommerce-userCart').subscribe((response: any) => {
        this.cartList = response;
        this.onCartListChange.next(this.cartList);
        resolve(this.cartList);
      }, reject);
    });
  }

  /**
   * Get Selected Product
   */
  getSelectedProduct(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const product = this.productList?.filter(product => product.id === this.idHandel);
      this.selectedProduct = product;
      this.onSelectedProductChange.next(product);
      resolve(this.selectedProduct);
    });
  }

  getProduct(): EComProduct {
    return this.productList.find(product => product.id === this.idHandel);
  }

  /**
   * Get Related Products
   */
  getRelatedProducts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient.get('api/ecommerce-relatedProducts').subscribe((response: any) => {
        this.relatedProducts = response;
        this.onRelatedProductsChange.next(this.relatedProducts);
        resolve(this.relatedProducts);
      }, reject);
    });
  }

  /**
   * Sort Product
   *
   * @param sortBy
   */
  sortProduct(sortBy) {
    let sortDesc = false;

    const sortByKey = (() => {
      if (sortBy === 'price-desc') {
        sortDesc = true;
        return 'price';
      }
      if (sortBy === 'price-asc') {
        return 'price';
      }
      sortDesc = true;
      return 'id';
    })();

    const sortedData = this.productList.sort(this.sortRef(sortByKey));
    if (sortDesc) sortedData.reverse();
    this.productList = sortedData;
    this.onProductListChange.next(this.productList);
  }

  /**
   * Add In Wishlist
   *
   * @param id
   */
  addToWishlist(id) {
    return new Promise<void>((resolve, reject) => {
      const lengthRef = this.wishlist.length + 1;
      const wishRef = { id: lengthRef, productId: id };

      this._httpClient.post('api/ecommerce-userWishlist/' + lengthRef, { ...wishRef }).subscribe(response => {
        this.getWishlist();
        resolve();
      }, reject);
    });
  }

  /**
   * Remove From Wishlist
   *
   * @param id
   */
  removeFromWishlist(id) {
    const indexRef = this.wishlist.findIndex(wishlistRef => wishlistRef.productId === id); // Get the index ref
    const indexId = this.wishlist[indexRef].id; // Get the product wishlist id from indexRef
    return new Promise<void>((resolve, reject) => {
      this._httpClient.delete('api/ecommerce-userWishlist/' + indexId).subscribe((response: any) => {
        this.getWishlist();
        resolve();
      }, reject);
    });
  }

  getLinha(_id: string) {
    for (const linha of this.sacola.linhas) {
      if (linha._id === _id) {
        return linha;
      }
    }
    console.error('Item not found');
    return null;
  }

  getItem(id: string) {
    for (const categoria of this.cardapio.categorias) {
      for (const item of categoria.itens) {
        if (item.id === id) {
          return item;
        }
      }
    }
    console.error('Item not found');
    return null;
  }

  /**
   * Add In Cart
   *
   * @param id
   */
  addToCart(id: string): Promise<void> {
    const item = this.getItem(id);
    if (!item) {
      return;
    }
    this.sacola.adiciona(item);
    return new Promise<void>((resolve, reject) => {
      const product = this.productList.find(product => product.id === id);
      if (product) {
        product.isInCart = true;
      }
      const maxValueId = Math.max(...this.cartList.map(cart => cart.id), 0) + 1;
      const cartRef = { id: maxValueId, productId: id, qty: 1 };
      var cartId: any = '';

      // If cart is not Empty
      if (maxValueId !== 1) {
        cartId = maxValueId;
      }
      this.onSacolaChange.next(this.sacola);
      this._httpClient.post('api/ecommerce-userCart/' + cartId, { ...cartRef }).subscribe(response => {
        this.getCartList();
        resolve();
      }, reject);
    });
  }


  sacolaLinhaQuantidade(linha: SacolaLinha, quantidade: number) {
    const _linha = this.getLinha(linha._id);
    if (!_linha) {
      return;
    }
    _linha.quantidade = quantidade;
    this.sacola.linhaAtualizaQuantidade(_linha, quantidade);
    this.onSacolaChange.next(this.sacola);
  }

  /**
   * Remove From Cart
   *
   * @param id
   */
  removeFromCart(linha: SacolaLinha) {
    this.sacola.remove(linha);
    const indexRef = this.cartList.findIndex(cartListRef => cartListRef.productId === linha.item.id); // Get the index ref
    const indexId = this.cartList[indexRef].id; // Get the product wishlist id from indexRef
    this.onSacolaChange.next(this.sacola);
    return new Promise<void>((resolve, reject) => {
      this._httpClient.delete('api/ecommerce-userCart/' + indexId).subscribe((response: any) => {
        this.getCartList();
        resolve();
      }, reject);
    });
  }

  confirma() {
    const pedido = new Pedido();
    pedido.tipo = PedidoTipo.Autoatendimento;
    pedido.empresa = this.empresa;
    pedido.estabelecimento = this.estabelecimento;
    pedido.referencia = '';
    if (this.localizador) {
      pedido.tipo = this.localizador.tipo || PedidoTipo.Autoatendimento;
      pedido.localizador = this.localizador;
      pedido.referencia = this.localizador.codigo;
    }
    pedido.modelo = PedidoModelo.Constel;
    pedido.pedidoItens = [];
    var sequencial = 0;
    this.sacola.linhas.forEach(linha => {
      const pedidoItem = new PedidoItem();
      pedidoItem.item = new Item();
      pedidoItem.sequencial = ++sequencial;
      pedidoItem.item.id = linha.item.id;
      pedidoItem.item.nome = linha.item.id;
      pedidoItem.itemIdentificador = linha.item.id;
      pedidoItem.itemNome = linha.item.nome;
      pedidoItem.valor = linha.valor;
      pedidoItem.quantidade = linha.quantidade;
      pedidoItem.medida = 'UN';
      pedidoItem.subtotal = linha.total;
      pedidoItem.opcionais = 0.00;
      pedidoItem.total = linha.total;
      pedido.pedidoItens.push(pedidoItem);
    });
    pedido.subtotal = this.sacola.total;
    pedido.acrescimo = 0.00;
    pedido.frete = 0.00;
    pedido.abatimento = 0.00;
    pedido.desconto = 0.00;
    pedido.total = this.sacola.total;
    this.apiService.grava<Pedido>(`aps://integracao/pedido/grava`, pedido, {
      'empresa-id': this.empresa.id,
      'empresa-nome': this.empresa.nome,
      'estabelecimento-id': this.estabelecimento.id,
      'estabelecimento-nome': this.estabelecimento.nome,
    }).subscribe(() => {
      this.sacola.inicia();
      this.apiService.exibeSucesso('Pedido enviado');
    });
  }
}
