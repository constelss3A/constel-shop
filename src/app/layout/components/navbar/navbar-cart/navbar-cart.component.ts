import { Component, OnInit } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { Sacola, SacolaLinha } from 'app/main/apps/ecommerce/modelo/sacola';

@Component({
  selector: 'app-navbar-cart',
  templateUrl: './navbar-cart.component.html'
})
export class NavbarCartComponent implements OnInit {
  private _unsubscribeAll: Subject<any>;

  sacola: Sacola;

  constructor(public _ecommerceService: EcommerceService) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this._ecommerceService.onSacolaChange.pipe(takeUntil(this._unsubscribeAll)).subscribe(sacola => {
      this.sacola = sacola;
      console.log('sacola atualizada x2', this.sacola);
    });

  }

  quantidadeChange(linha: SacolaLinha, event: any) {
    this._ecommerceService.sacolaLinhaQuantidade(linha, event || 0);
  }

  exclui(linha: SacolaLinha) {
    this._ecommerceService.removeFromCart(linha);
  }

  confirma() {
    this._ecommerceService.confirma();
  }
}
