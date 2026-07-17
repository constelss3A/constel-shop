import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { Sacola, SacolaLinha } from 'app/main/apps/ecommerce/modelo/sacola';
import { AuthenticationService } from 'app/auth/service';

declare const google: any;

@Component({
  selector: 'app-navbar-cart',
  templateUrl: './navbar-cart.component.html'
})
export class NavbarCartComponent implements OnInit {
  private _unsubscribeAll: Subject<any>;
  private googleReady = false;

  sacola: Sacola;

  constructor(
    public _ecommerceService: EcommerceService,
    private _router: Router,
    private _authenticationService: AuthenticationService,
    private _ngZone: NgZone,
  ) {
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

  get precisaLogin(): boolean {
    return this._ecommerceService.isDelivery && !this._authenticationService.currentUserValue;
  }

  confirma() {
    if (this.precisaLogin) {
      this.loginGoogle();
      return;
    }
    this._router.navigate(['/apps/e-commerce/checkout']);
  }

  private loginGoogle(): void {
    if (this.googleReady && typeof google !== 'undefined') {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btnEl = document.getElementById('cart-google-btn');
          const googleBtn = btnEl ? btnEl.querySelector('div[role="button"]') as HTMLElement : null;
          if (googleBtn) {
            googleBtn.click();
          }
        }
      });
    } else {
      this.initGoogle();
      setTimeout(() => this.loginGoogle(), 600);
    }
  }

  private initGoogle(): void {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      const script = document.querySelector('script[src*="accounts.google.com"]');
      if (script) {
        script.addEventListener('load', () => this.initGoogle());
      }
      return;
    }
    google.accounts.id.initialize({
      client_id: '610456046637-h2s9nfskkg8jad5t2jpi1lg5t3n0b509.apps.googleusercontent.com',
      callback: (res: any) => this._ngZone.run(() => this.handleGoogleResponse(res)),
    });
    const btnEl = document.getElementById('cart-google-btn');
    if (btnEl) {
      google.accounts.id.renderButton(btnEl, { size: 'large' });
    }
    this.googleReady = true;
  }

  private handleGoogleResponse(response: any): void {
    this._authenticationService.loginWithGoogle(response.credential);
    this._router.navigate(['/apps/e-commerce/checkout']);
  }

  getTotalLinha(linha: SacolaLinha): number {
    if(linha.item.montagemTipo === 10) {
      return this.sacola.linhas.reduce((total, l) => {
        if(l.item.montagemBloco === linha.item.montagemBloco) {
          return total + l.total;
        }
        return total;
      }, 0);
    } else {
      return linha.total;
    }
  }
}
