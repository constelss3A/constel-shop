import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, concatMap, map, tap } from 'rxjs/operators';

import { AuthenticationService } from 'app/auth/service';
import { EComProduct } from './modelo/product';
import { ApiService } from 'app/modulos/api.service';
import { Cardapio, CardapioItem } from './modelo/cardapio';
import { Empresa } from 'app/modulos/administrativo/empresa/empresa';
import {
  Estabelecimento, estabelecimentoEnderecoOrigem, estabelecimentoEnderecoQueries,
} from 'app/modulos/administrativo/estabelecimento/estabelecimento';
import { Sacola, SacolaCliente, SacolaLinha } from './modelo/sacola';
import { Localizador } from 'app/modulos/venda/localizador/localizador';
import { Pedido, PedidoModelo, PedidoTipo } from 'app/modulos/integracao/pedido/pedido';
import { PedidoItem } from 'app/modulos/integracao/pedido/pedido-item';
import { Item } from 'app/modulos/recurso/item/item';
import { Cliente } from 'app/modulos/venda/localizador/cliente/cliente';
import { Endereco } from 'app/modulos/venda/entrega/endereco';
import { Coordenada, TaxaEntregaConfig, taxaEntregaConfigPadrao } from 'app/modulos/venda/entrega/taxa-entrega';
import { taxaEntregaCalcula } from 'app/modulos/venda/entrega/taxa-entrega-calculo';
import { EntregaTipo } from 'app/modulos/movimento/pagamento/pagamento';

@Injectable({
  providedIn: 'root'
})
export class EcommerceService implements Resolve<any> {
  // Public
  empresa: Empresa;
  estabelecimento: Estabelecimento;
  localizador: Localizador;
  endereco: Endereco;
  frete: number = 0.00;
  foraDeArea: boolean = false;
  freteCalculando: boolean = false;
  taxaConfig: TaxaEntregaConfig;
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
  onEnderecoChange: BehaviorSubject<any>;
  onFreteChange: BehaviorSubject<any>;
  onTaxaConfigChange: BehaviorSubject<any>;
  onCardapioChange: BehaviorSubject<any>;
  onSacolaChange: BehaviorSubject<any>;
  onProductListChange: BehaviorSubject<any>;
  onRelatedProductsChange: BehaviorSubject<any>;
  onWishlistChange: BehaviorSubject<any>;
  onCartListChange: BehaviorSubject<any>;
  onSelectedProductChange: BehaviorSubject<any>;

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
    private authService: AuthenticationService,
    private _router: Router,
  ) {
    this.sacola = new Sacola();
    this.onEmpresaChange = new BehaviorSubject({});
    this.onEstabelecimentoChange = new BehaviorSubject({});
    this.onLocalizadorChange = new BehaviorSubject({});
    this.onEnderecoChange = new BehaviorSubject({});
    this.onFreteChange = new BehaviorSubject({});
    this.onTaxaConfigChange = new BehaviorSubject({});
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
    const hasContext = !!(route.params.empresaid || route.params.estabelecimentoid || route.params.localizadorid);
    if (hasContext) {
      this.empresaId = route.params.empresaid;
      this.estabelecimentoId = route.params.estabelecimentoid;
      this.localizadorId = route.params.localizadorid;
      this.sacola = new Sacola();
      this.onSacolaChange.next(this.sacola);
      this.taxaEntregaConfigCarrega();
      this.enderecoCarrega();
    }
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.getEmpresa(), this.getEstabelecimento(), this.getLocalizador(), this.getCardapio(), this.getWishlist(), this.getCartList(), this.getSelectedProduct()]).then(() => {
        resolve();
      }, reject);
    });
  }

  getEmpresa(): Promise<{ ok: boolean }> {
    if (!this.empresaId) {
      this.empresa = null;
      return Promise.resolve({ ok: false });
    }
    return new Promise((resolve, reject) => {
      this.apiService.encontra<Empresa>(`aps://integracao/cardapio/empresa/${this.empresaId}`, '').subscribe((empresa: Empresa) => {
        this.empresa = empresa;
        this.onEmpresaChange.next(empresa);
        resolve({ ok: true });
      }, reject);
    });
  }

  getEstabelecimento(): Promise<{ ok: boolean }> {
    if (!this.estabelecimentoId) {
      this.estabelecimento = null;
      return Promise.resolve({ ok: false });
    }
    return new Promise((resolve, reject) => {
      this.apiService.encontra<Estabelecimento>(`aps://integracao/cardapio/estabelecimento/${this.estabelecimentoId}`, '').subscribe((estabelecimento: Estabelecimento) => {
        this.estabelecimento = estabelecimento;
        this.onEstabelecimentoChange.next(estabelecimento);
        this.estabelecimentoOrigemCarrega();
        resolve({ ok: true });
      }, reject);
    });
  }

  // A origem do frete e o endereco de entrega do proprio estabelecimento, que ja vem no
  // payload do cardapio. Geocodifica uma vez e guarda - o endereco da loja nao muda.
  // Assincrono de proposito: nao segura a abertura do shop. Quando a coordenada chega,
  // o frete e recalculado sozinho.
  estabelecimentoOrigemCarrega(): void {
    this.estabelecimentoOrigemObtem().subscribe(coord => {
      if (coord) {
        this.origemAplica(coord);
      }
    });
  }

  // Coordenada do endereco do estabelecimento, geocodificada e guardada. Nao aplica em lugar
  // nenhum - quem chama decide. A tela de config usa isto para posicionar o pino; o shop usa
  // para calcular o frete.
  estabelecimentoOrigemObtem(): Observable<Coordenada | null> {
    const queries = estabelecimentoEnderecoQueries(estabelecimentoEnderecoOrigem(this.estabelecimento));
    if (!queries.length) {
      return of(null);
    }
    const cache = this.apiService.getStorageData('delivery', this.origemChave());
    if (cache) {
      return of(cache as Coordenada);
    }
    return this.geocodificaPrimeira(queries).pipe(
      tap(coord => {
        if (coord) {
          this.apiService.setStorageData('delivery', this.origemChave(), coord);
        }
      }),
    );
  }

  // Endereco do estabelecimento em texto, para a tela de config mostrar de onde sai a entrega.
  estabelecimentoEnderecoTexto(): string {
    const endereco = estabelecimentoEnderecoOrigem(this.estabelecimento);
    if (!endereco) {
      return '';
    }
    const numero = endereco.numero ? `, ${endereco.numero}` : '';
    const partes = [
      `${endereco.logradouro || ''}${numero}`,
      endereco.bairro,
      [endereco.municipio?.nome, endereco.uf?.sigla].filter(Boolean).join('/'),
    ];
    return partes.filter(p => p && p.trim()).join(' - ');
  }

  // A config ja foi salva alguma vez para este estabelecimento? Quando nao foi, a tela de
  // config pode posicionar o pino sozinha; quando foi, o pino do lojista manda.
  taxaEntregaConfigExiste(): boolean {
    return !!this.apiService.getStorageData('delivery', this.taxaChave());
  }

  // Tenta as buscas em ordem e para na primeira que responder. Sequencial de proposito:
  // o Nominatim aceita 1 req/s, e isto roda uma vez por estabelecimento (depois vem do cache).
  private geocodificaPrimeira(queries: string[]): Observable<Coordenada | null> {
    if (!queries.length) {
      return of(null);
    }
    const [primeira, ...resto] = queries;
    return this.geocodifica(primeira).pipe(
      concatMap(coord => (coord ? of(coord) : this.geocodificaPrimeira(resto))),
    );
  }

  private origemChave(): string {
    return `geo.origem.${this.estabelecimentoId}`;
  }

  private origemAplica(origem: Coordenada): void {
    const config = this.taxaConfig || this.taxaEntregaConfigCarrega();
    config.origem = origem;
    this.onTaxaConfigChange.next(config);
    this.freteRecalcula();
  }

  getLocalizador(): Promise<{ ok: boolean }> {
    if (!this.localizadorId) {
      this.localizador = null;
      this.onLocalizadorChange.next(this.localizador);
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

  get isDelivery(): boolean {
    return !this.localizadorId;
  }

  contextoDefine(empresaId: string, estabelecimentoId: string): void {
    this.empresaId = empresaId;
    this.estabelecimentoId = estabelecimentoId;
  }

  // Frete calculado pelo motor unificado. Mantem a assinatura usada pelo checkout e pelo confirma().
  getFreteEntrega(): number {
    return this.frete;
  }

  private taxaChave(): string {
    return `taxa.${this.empresaId}.${this.estabelecimentoId}`;
  }

  taxaEntregaConfigCarrega(): TaxaEntregaConfig {
    const dado = this.apiService.getStorageData('delivery', this.taxaChave());
    this.taxaConfig = dado ? (dado as TaxaEntregaConfig) : taxaEntregaConfigPadrao();
    this.onTaxaConfigChange.next(this.taxaConfig);
    return this.taxaConfig;
  }

  taxaEntregaConfigSalva(config: TaxaEntregaConfig): void {
    this.taxaConfig = config;
    this.apiService.setStorageData('delivery', this.taxaChave(), config);
    this.onTaxaConfigChange.next(this.taxaConfig);
  }

  // Recalcula o frete do endereco atual e publica em onFreteChange.
  // Fora do delivery (mesa) ou sem endereco => frete zero.
  freteRecalcula(): void {
    if (!this.isDelivery || !this.endereco) {
      this.frete = 0.00;
      this.foraDeArea = false;
      this.freteCalculando = false;
      this.onFreteChange.next({ frete: this.frete, foraDeArea: this.foraDeArea, calculando: false });
      return;
    }
    const config = this.taxaConfig || this.taxaEntregaConfigCarrega();
    this.freteCalculando = true;
    this.onFreteChange.next({ frete: this.frete, foraDeArea: this.foraDeArea, calculando: true });
    this.enderecoGeocodifica(this.endereco).subscribe(coord => {
      this.endereco.latitude = coord.latitude;
      this.endereco.longitude = coord.longitude;
      const resultado = taxaEntregaCalcula(config, coord, this.sacola.total);
      this.frete = resultado.dentroDaArea ? resultado.valor : 0.00;
      this.foraDeArea = !resultado.dentroDaArea;
      this.freteCalculando = false;
      this.onFreteChange.next({
        frete: this.frete, foraDeArea: this.foraDeArea, calculando: false,
        distanciaKm: resultado.distanciaKm,
      });
    });
  }

  // Geocoding do endereco. Real via Nominatim/OSM (gratuito, 1 req/s, exige cache).
  // Fallback mock deterministico (derivado do CEP) quando a chamada falhar.
  // Assinatura final Observable para trocar de provedor sem mexer na UI.
  enderecoGeocodifica(endereco: Endereco): Observable<Coordenada> {
    const cepNorm = (endereco.cep || '').replace(/\D/g, '');
    const cacheChave = `geo.${cepNorm}.${(endereco.numero || '').trim()}`;
    const cache = this.apiService.getStorageData('delivery', cacheChave);
    if (cache) {
      return of(cache as Coordenada);
    }
    const q = [endereco.logradouro, endereco.numero, endereco.bairro, endereco.cidade, endereco.uf, 'Brasil']
      .filter(Boolean).join(', ');
    return this.geocodifica(q).pipe(
      map(coord => {
        if (!coord) {
          return this.geocodificaMock(endereco);
        }
        this.apiService.setStorageData('delivery', cacheChave, coord);
        return coord;
      }),
    );
  }

  // Geocodificacao crua, sem cache e sem invencao: devolve null quando o provedor nao
  // souber responder. Cada chamador decide o que fazer com o null.
  //
  // Photon, nao Nominatim. Os dois leem o mesmo OpenStreetMap, mas o Nominatim nao encontra
  // nossos enderecos reais - nem "Rua Tiburcio Cavalcanti, 2579, Fortaleza" (a rua esta no
  // OSM grafada "Cavalcante"), nem "Quadra SQN 308 Bloco C, Brasilia" (o bloco esta la).
  // O Photon acha os dois: o dado sempre esteve no OSM, o buscador do Nominatim e que nao
  // chegava nele. Verificado ao vivo contra as duas unidades em 2026-07-16.
  //
  // Cuidado ao mexer na busca: sem bairro e UF, o Photon casa nome de rua igual em outro
  // estado (o mesmo "Rua Tiburcio Cavalcanti" existe no Parana, 2.000 km fora) e devolve
  // sem sinal de erro. As buscas montadas aqui sempre levam regiao junto.
  private geocodifica(query: string): Observable<Coordenada | null> {
    const url = `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(query)}`;
    return this._httpClient.get<any>(url).pipe(
      map(res => {
        const ponto = res?.features?.[0]?.geometry?.coordinates;
        return ponto ? { latitude: ponto[1], longitude: ponto[0] } : null;
      }),
      catchError(() => of(null)),
    );
  }

  private geocodificaMock(endereco: Endereco): Coordenada {
    const origem = (this.taxaConfig || taxaEntregaConfigPadrao()).origem;
    const digitos = (endereco.cep || '').replace(/\D/g, '');
    const semente = digitos ? parseInt(digitos.slice(-4), 10) : 0;
    const offsetKm = semente % 12;
    const rumo = ((semente % 360) * Math.PI) / 180;
    const dLat = (offsetKm / 111) * Math.cos(rumo);
    const dLng = (offsetKm / (111 * Math.cos((origem.latitude * Math.PI) / 180))) * Math.sin(rumo);
    return { latitude: origem.latitude + dLat, longitude: origem.longitude + dLng };
  }

  private enderecoChave(): string {
    return `endereco.${this.empresaId}.${this.estabelecimentoId}`;
  }

  enderecoCarrega() {
    if (!this.isDelivery) {
      this.endereco = null;
      this.onEnderecoChange.next(this.endereco);
      return;
    }
    const dado = this.apiService.getStorageData('delivery', this.enderecoChave());
    this.endereco = dado ? Object.assign(new Endereco(), dado) : null;
    this.onEnderecoChange.next(this.endereco);
    this.freteRecalcula();
  }

  enderecoSalva(endereco: Endereco) {
    if (!endereco.id) {
      endereco.id = Date.now().toString();
    }
    this.endereco = endereco;
    this.apiService.setStorageData('delivery', this.enderecoChave(), endereco);
    this.onEnderecoChange.next(this.endereco);
    this.freteRecalcula();
  }

  enderecoResumo(endereco: Endereco): string {
    if (!endereco) {
      return '';
    }
    const complemento = endereco.complemento ? ` - ${endereco.complemento}` : '';
    return `${endereco.logradouro}, ${endereco.numero}${complemento} - ${endereco.bairro} - ${endereco.cidade}/${endereco.uf}`;
  }

  // Busca endereco por CEP (ViaCEP, gratuito, sem chave). Assinatura final Observable;
  // trocar por outro provedor/endpoint depois sem mexer na UI.
  enderecoBuscaCep(cep: string): Observable<{ logradouro: string; bairro: string; cidade: string; uf: string } | null> {
    const cepNorm = (cep || '').replace(/\D/g, '');
    if (cepNorm.length !== 8) {
      return of(null);
    }
    return this._httpClient.get<any>(`https://viacep.com.br/ws/${cepNorm}/json/`).pipe(
      map(res => {
        if (!res || res.erro) {
          return null;
        }
        return {
          logradouro: res.logradouro || '',
          bairro: res.bairro || '',
          cidade: res.localidade || '',
          uf: res.uf || '',
        };
      }),
      catchError(() => of(null)),
    );
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

  getItemDetalhado(id: string): Observable<Item> {
    return this.apiService.obtem<Item>(`aps://integracao/cardapio/item`, id);
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

  /**
   * Add In Cart
   *
   * @param id
   */
  addComposicaoToCart(item: Item): Promise<void> {
    // const item = this.getItem(id);
    if (!item) {
      return;
    }
    this.sacola.adiciona(item, item.quantidade);
    return new Promise<void>((resolve, reject) => {
      const product = this.productList.find(product => product.id === item.id);
      if (product) {
        product.isInCart = true;
      }
      const maxValueId = Math.max(...this.cartList.map(cart => cart.id), 0) + 1;
      const cartRef = { id: maxValueId, productId: item.id, qty: item.quantidade };
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

  sacolaIdentifica(cliente: SacolaCliente) {
    this.sacola.identifica(cliente);
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

  confirma(opcoes: {
    entregaTipo?: number;
    formaPagamento?: { forma: number; nome: string };
    frete?: number;
    trocoPara?: number;
  } = {}) {
    const pedido = new Pedido();
    pedido.tipo = PedidoTipo.Autoatendimento;
    pedido.empresa = {
      id: this.empresa.id,
      codigo: this.empresa.codigo,
      nome: this.empresa.nome,
    };
    pedido.estabelecimento = {
      id: this.estabelecimento.id,
      codigo: this.estabelecimento.codigo,
      nome: this.estabelecimento.nome,
    };
    pedido.referencia = '';
    if (this.localizador) {
      pedido.tipo = this.localizador.tipo || PedidoTipo.Autoatendimento;
      pedido.localizador = {
        id: this.localizador.id,
        codigo: this.localizador.codigo,
        nome: this.localizador.nome,
        tipo: this.localizador.tipo,
      };
      pedido.referencia = this.localizador.codigo;
    }
    const entregaTipo = opcoes.entregaTipo || EntregaTipo.Entrega;
    if (this.isDelivery && entregaTipo === EntregaTipo.Entrega && this.endereco) {
      pedido.tipo = PedidoTipo.Delivery;
      pedido.entrega = {
        cep: this.endereco.cep,
        logradouro: this.endereco.logradouro,
        numero: this.endereco.numero,
        complemento: this.endereco.complemento,
        bairro: this.endereco.bairro,
        cidade: this.endereco.cidade,
        uf: this.endereco.uf,
        pontoReferencia: this.endereco.pontoReferencia,
      };
      pedido.referencia = this.enderecoResumo(this.endereco);
    } else if (this.isDelivery && entregaTipo === EntregaTipo.Retirada) {
      pedido.tipo = PedidoTipo.Autoatendimento;
      pedido.referencia = 'Retirada';
    }
    if (opcoes.formaPagamento) {
      pedido.pagamento = {
        forma: opcoes.formaPagamento.forma,
        nome: opcoes.formaPagamento.nome,
      };
      // So vai quando ha troco a levar. Sem isto o pedido carregaria trocoPara: null em
      // toda compra no Pix, e o backend teria que adivinhar o que fazer com isso.
      if (opcoes.trocoPara > 0) {
        pedido.pagamento.trocoPara = opcoes.trocoPara;
      }
    }
    const user = this.authService.currentUserValue;
    if (user) {
      pedido.pedidoCliente = new Cliente();
      pedido.pedidoCliente.identificador = user.id?.toString() || user.email;
      pedido.pedidoCliente.nome = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      pedido.pedidoCliente.email = user.email || '';
      pedido.pedidoCliente.imagem = user.avatar || '';
      if (pedido.pedidoCliente.nome.includes('-')) {
        pedido.pedidoCliente.nome = pedido.pedidoCliente.nome.split('-')[0].trim();
      }
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
    const frete = pedido.tipo === PedidoTipo.Delivery ? (opcoes.frete ?? this.getFreteEntrega()) : 0.00;
    pedido.subtotal = this.sacola.total;
    pedido.acrescimo = 0.00;
    pedido.frete = frete;
    pedido.abatimento = 0.00;
    pedido.desconto = 0.00;
    pedido.total = this.sacola.total + frete;
    // const clienteInfo = pedido.pedidoCliente
    //   ? `${pedido.pedidoCliente.nome} (${pedido.pedidoCliente.email})`
    //   : 'Anônimo';
    // alert(`Confirmando pedido de ${clienteInfo}\n${pedido.pedidoItens.length} item(ns) — Total: R$ ${pedido.total.toFixed(2)}`);
    this.apiService.grava<Pedido>(`aps://integracao/pedido/grava`, pedido, {
      'empresa-id': this.empresa.id,
      'empresa-nome': this.empresa.nome,
      'estabelecimento-id': this.estabelecimento.id,
      'estabelecimento-nome': this.estabelecimento.nome,
    }).subscribe(() => {
      this.sacola.inicia();
      this.apiService.exibeSucesso('Pedido enviado', 2500);
      setTimeout(() => {
        this.apiService.limpaMensagens();
        this.voltarParaCardapio();
      }, 2500);
    });
  }

  voltarParaCardapio() {
    if (!this.empresa || !this.estabelecimento || !this.localizador) {
      return;
    }
    this._router.navigate([`/apps/e-commerce/shop/${this.empresa.id}/${this.estabelecimento.id}/${this.localizador.id}`]);
  }
}
