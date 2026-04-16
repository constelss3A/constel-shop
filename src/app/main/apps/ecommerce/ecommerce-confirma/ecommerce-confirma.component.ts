import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';

import Stepper from 'bs-stepper';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { Sacola, SacolaCliente, SacolaLinha } from '../modelo/sacola';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-ecommerce-confirma',
  templateUrl: './ecommerce-confirma.component.html',
  styleUrls: ['./ecommerce-confirma.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ecommerce-application' }
})
export class EcommerceConfirmaComponent implements OnInit {
  private _unsubscribeAll: Subject<any>;

  sacola: Sacola;

  // Public
  public contentHeader: object;
  public products;
  public cartLists;
  public wishlist;

  public address = {
    fullNameVar: '',
    numberVar: '',
    flatVar: '',
    landmarkVar: '',
    cityVar: '',
    pincodeVar: '',
    stateVar: ''
  };

  // Private
  private checkoutStepper: Stepper;

  constructor(
    private _ecommerceService: EcommerceService,
  ) {
    this._unsubscribeAll = new Subject();
  }

  nextStep() {
    this.checkoutStepper.next();
  }

  previousStep() {
    this.checkoutStepper.previous();
  }

  validateNextStep(addressForm) {
    if (addressForm.valid) {
      this.nextStep();
    }
  }

  ngOnInit(): void {
    // Subscribe to ProductList change
    this._ecommerceService.onProductListChange.subscribe(res => {
      this.products = res;

      this.products.isInWishlist = false;
    });

    // Subscribe to Cartlist change
    this._ecommerceService.onCartListChange.subscribe(res => (this.cartLists = res));

    // Subscribe to Wishlist change
    this._ecommerceService.onWishlistChange.subscribe(res => (this.wishlist = res));

    // update product is in Wishlist & is in CartList : Boolean
    this.products.forEach(product => {
      product.isInWishlist = this.wishlist.findIndex(p => p.productId === product.id) > -1;
      product.isInCart = this.cartLists.findIndex(p => p.productId === product.id) > -1;
    });

    this.checkoutStepper = new Stepper(document.querySelector('#checkoutStepper'), {
      linear: false,
      animation: true
    });

    this._ecommerceService.onSacolaChange.pipe(takeUntil(this._unsubscribeAll)).subscribe(sacola => {
      this.sacola = sacola;
      console.log('sacola atualizada x2', this.sacola);
    });

    // content header
    this.contentHeader = {
      headerTitle: 'Checkout',
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
            name: 'Confirmação',
            isLink: false
          }
        ]
      }
    };
  }

  finalizar() {
    this._ecommerceService.confirma();
  }

  quantidadeChange(linha: SacolaLinha, event: any) {
    this._ecommerceService.sacolaLinhaQuantidade(linha, event || 0);
  }

  exclui(linha: SacolaLinha) {
    this._ecommerceService.removeFromCart(linha);
  }

}