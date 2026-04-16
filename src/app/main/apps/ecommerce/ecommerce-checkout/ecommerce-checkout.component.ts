import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { AuthenticationService } from 'app/auth/service';
import { Sacola, SacolaCliente, SacolaLinha } from '../modelo/sacola';

declare const google: any;

@Component({
  selector: 'app-ecommerce-checkout',
  templateUrl: './ecommerce-checkout.component.html',
  styleUrls: ['./ecommerce-checkout.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ecommerce-application' }
})
export class EcommerceCheckoutComponent implements OnInit, AfterViewInit, OnDestroy {
  public contentHeader: object;
  public sacola: Sacola;
  public localizador: any;
  public logado = false;

  private _unsubscribeAll = new Subject<void>();
  private googleReady = false;

  constructor(
    private _ecommerceService: EcommerceService,
    private _authenticationService: AuthenticationService,
    private _ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this._ecommerceService.onSacolaChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(sacola => (this.sacola = sacola));

    this._ecommerceService.onLocalizadorChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(localizador => (this.localizador = localizador));

    this._authenticationService.currentUser
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(user => {
        this.logado = !!user;
        if (!this.logado) {
          setTimeout(() => this.waitForGoogleAndInit(), 0);
        }
      });

    this.contentHeader = {
      headerTitle: 'Checkout',
      actionButton: true,
      breadcrumb: {
        type: '',
        links: [
          { name: 'Home', isLink: true, link: '/' },
          { name: 'eCommerce', isLink: true, link: '/' },
          { name: 'Checkout', isLink: false }
        ]
      }
    };
  }

  ngAfterViewInit(): void {
    if (!this.logado) {
      this.waitForGoogleAndInit();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  exclui(linha: SacolaLinha) {
    this._ecommerceService.removeFromCart(linha);
  }

  quantidadeChange(linha: SacolaLinha, event: any) {
    this._ecommerceService.sacolaLinhaQuantidade(linha, event || 0);
  }

  finalizar() {
    this._ecommerceService.confirma();
  }

  private waitForGoogleAndInit(attempts = 0): void {
    const btnEl = document.getElementById('checkout-google-btn');
    if (!btnEl) {
      if (attempts > 50) return;
      setTimeout(() => this.waitForGoogleAndInit(attempts + 1), 200);
      return;
    }
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      if (attempts > 50) {
        console.error('Google Sign-In: script não carregou');
        return;
      }
      setTimeout(() => this.waitForGoogleAndInit(attempts + 1), 200);
      return;
    }
    google.accounts.id.initialize({
      client_id: '610456046637-h2s9nfskkg8jad5t2jpi1lg5t3n0b509.apps.googleusercontent.com',
      callback: (res: any) => this._ngZone.run(() => this.handleGoogleResponse(res)),
    });
    google.accounts.id.renderButton(btnEl, { theme: 'filled_blue', size: 'large', text: 'continue_with', shape: 'rectangular' });
    this.googleReady = true;
  }

  private handleGoogleResponse(response: any): void {
    this._authenticationService.loginWithGoogle(response.credential);
  }
}
