import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';

@Component({
  selector: 'app-ecommerce-confirma-item',
  templateUrl: './ecommerce-confirma-item.component.html',
  styleUrls: ['../ecommerce-confirma.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EcommerceConfirmaComponent implements OnInit {
  // Input Decorator
  @Input() product;

  /**
   * Constructor
   *
   * @param {EcommerceService} _ecommerceService
   */
  constructor(private _ecommerceService: EcommerceService) {}

  /**
   * Remove From Cart
   *
   * @param product
   */
  removeFromCart(product) {
    if (product.isInCart === true) {
      this._ecommerceService.removeFromCart(product.id).then(res => {
        product.isInCart = false;
      });
    }
  }

  /**
   * Toggle Wishlist
   *
   * @param product
   */
  toggleWishlist(product) {
    if (product.isInWishlist === true) {
      this._ecommerceService.removeFromWishlist(product.id).then(res => {
        product.isInWishlist = false;
      });
    } else {
      this._ecommerceService.addToWishlist(product.id).then(res => {
        product.isInWishlist = true;
      });
    }
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------
  ngOnInit(): void {}
}
