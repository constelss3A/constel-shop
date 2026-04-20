import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { Empresa } from 'app/modulos/administrativo/empresa/empresa';
import { Estabelecimento } from 'app/modulos/administrativo/estabelecimento/estabelecimento';
import { Localizador } from 'app/modulos/venda/localizador/localizador';
import { Cardapio, CardapioItem } from '../modelo/cardapio';

@Component({
  selector: 'app-ecommerce-shop',
  templateUrl: './ecommerce-shop.component.html',
  styleUrls: ['./ecommerce-shop.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ecommerce-application' }
})
export class EcommerceShopComponent implements OnInit {
  // public
  public contentHeader: object;
  public shopSidebarToggle = false;
  public shopSidebarReset = false;
  public gridViewRef = true;
  public wishlist;
  public cartList;
  public page = 1;
  public pageSize = 9;
  public searchText = '';

  public empresa: Empresa;
  public estabelecimento: Estabelecimento;
  public localizador: Localizador;
  public cardapio: Cardapio;

  public faixa: string;
  public avatar: string;

  /**
   *
   * @param {CoreSidebarService} _coreSidebarService
   * @param {EcommerceService} _ecommerceService
   */
  constructor(
    private _ecommerceService: EcommerceService,
  ) { }

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Update to List View
   */
  listView() {
    this.gridViewRef = false;
  }

  /**
   * Update to Grid View
   */
  gridView() {
    this.gridViewRef = true;
  }

  /**
   * Sort Product
   */
  sortProduct(sortParam) {
    this._ecommerceService.sortProduct(sortParam);
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to ProductList change

    this._ecommerceService.onEmpresaChange.subscribe(empresa => {
      this.empresa = empresa;
      console.log('empresa atualizada', this.empresa);
      this.faixa = empresa.empresaConfiguracao?.parametros?.visual?.cardapio?.faixa;
      this.avatar = empresa.imagem;
    });

    this._ecommerceService.onEstabelecimentoChange.subscribe(estabelecimento => {
      this.estabelecimento = estabelecimento;
    });

    this._ecommerceService.onLocalizadorChange.subscribe(localizador => {
      this.localizador = localizador;
      console.log('localizador atualizado', this.localizador);
    });

    this._ecommerceService.onCardapioChange.subscribe(cardapio => {
      this.cardapio = cardapio;
    });

    // Subscribe to Wishlist change
    this._ecommerceService.onWishlistChange.subscribe(res => (this.wishlist = res));

    // Subscribe to Cartlist change
    this._ecommerceService.onCartListChange.subscribe(res => (this.cartList = res));

    // content header
    this.contentHeader = {
      headerTitle: 'Loja',
      actionButton: true,
      breadcrumb: {
        type: '',
        links: [
          {
            name: 'Home',
            isLink: true,
            link: '/'
          },
          {
            name: 'eCommerce',
            isLink: true,
            link: '/'
          },
          {
            name: 'Loja',
            isLink: false
          }
        ]
      }
    };
  }

  formataValor(valor: number) {
    valor ??= 0.00;
    if ((valor % 1) === 0) {
      return 'R$ ' + valor.toFixed(0).replace('.', ',');
    }
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
  }

  irPara(id: string) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth' });
    }
  }

  sacolaAdiciona(item: CardapioItem) {
    const itemDetalhado = this._ecommerceService.getItemDetalhado(item.id).toPromise();
    console.log('itemDetalhado', itemDetalhado);
    this._ecommerceService.addToCart(item.id).then();
  }
}
