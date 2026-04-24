import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { AuthenticationService } from 'app/auth/service';
import { Sacola, SacolaLinha } from '../modelo/sacola';
import { Router } from '@angular/router';

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
    private _router: Router
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
      headerTitle: 'Confirmação',
      actionButton: true,
      breadcrumb: {
        type: '',
        links: [
          { name: 'Home', isLink: false, link: '/' },
          { name: 'eCommerce', isLink: false, link: '/' },
          { name: 'Confirmação', isLink: false }
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

  voltarParaCardapio() {
    const empresaId: string = this._ecommerceService.empresa.id;
    const estabelecimentoId: string = this._ecommerceService.estabelecimento.id;
    const localizadorId: string = this._ecommerceService.localizador.id;
    this._router.navigate([`/apps/e-commerce/shop/${empresaId}/${estabelecimentoId}/${localizadorId}`]);
  }

  private initGoogleSignIn(): void {
    const btnEl = document.getElementById('checkout-google-btn');
    if (!btnEl) return;
    google.accounts.id.initialize({
      client_id: '610456046637-h2s9nfskkg8jad5t2jpi1lg5t3n0b509.apps.googleusercontent.com',
      callback: (res: any) => this._ngZone.run(() => this.handleGoogleResponse(res)),
    });
    google.accounts.id.renderButton(btnEl, { theme: 'filled_blue', size: 'large', text: 'continue_with', shape: 'rectangular' });
    this.googleReady = true;
  }

  private waitForGoogleAndInit(): void {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      this.initGoogleSignIn();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com"]');
      if (script) {
        script.addEventListener('load', () => this.initGoogleSignIn());
      }
    }
  }

  private handleGoogleResponse(response: any): void {
    this._authenticationService.loginWithGoogle(response.credential);
  }
}
