import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { AuthenticationService } from 'app/auth/service';
import { ApiService } from 'app/modulos/api.service';
import { Endereco } from 'app/modulos/venda/entrega/endereco';
import { EntregaTipo, FormaPagamento } from 'app/modulos/movimento/pagamento/pagamento';
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
  public isDelivery = false;
  public endereco: Endereco;
  public enderecoEdicao = false;
  public enderecoForm: Endereco = new Endereco();
  public cepBuscando = false;
  public frete = 0.00;
  public foraDeArea = false;
  public freteCalculando = false;

  public EntregaTipo = EntregaTipo;
  public entregaTipo: number = EntregaTipo.Entrega;
  public formasPagamento: Array<{ forma: number; nome: string }> = [
    { forma: FormaPagamento.Pix, nome: 'Pix' },
    { forma: FormaPagamento.CartaoCredito, nome: 'Cartão de crédito' },
    { forma: FormaPagamento.CartaoDebito, nome: 'Cartão de débito' },
    { forma: FormaPagamento.Dinheiro, nome: 'Dinheiro' },
  ];
  public formaPagamento: { forma: number; nome: string } = null;

  private _unsubscribeAll = new Subject<void>();
  private googleReady = false;

  constructor(
    private _ecommerceService: EcommerceService,
    private _authenticationService: AuthenticationService,
    private _apiService: ApiService,
    private _ngZone: NgZone,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.isDelivery = this._ecommerceService.isDelivery;

    this._ecommerceService.onSacolaChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(sacola => (this.sacola = sacola));

    this._ecommerceService.onLocalizadorChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(localizador => (this.localizador = localizador));

    this._ecommerceService.onEnderecoChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(endereco => {
        this.endereco = endereco && endereco.id ? endereco : null;
        if (this.logado && this.isDelivery && this.isEntrega && !this.endereco) {
          this.enderecoNovo();
        }
      });

    this._ecommerceService.onFreteChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(estado => {
        this.frete = estado?.frete || 0.00;
        this.foraDeArea = !!estado?.foraDeArea;
        this.freteCalculando = !!estado?.calculando;
      });

    this._authenticationService.currentUser
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(user => {
        this.logado = !!user;
        if (!this.logado) {
          setTimeout(() => this.waitForGoogleAndInit(), 0);
        } else if (this.isDelivery && this.isEntrega && !this.endereco) {
          this.enderecoNovo();
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

  get isEntrega(): boolean {
    return this.entregaTipo === EntregaTipo.Entrega;
  }

  get freteExibido(): number {
    return this.isDelivery && this.isEntrega ? this.frete : 0.00;
  }

  get total(): number {
    return (this.sacola?.total || 0) + this.freteExibido;
  }

  selecionaEntregaTipo(tipo: number) {
    this.entregaTipo = tipo;
    if (this.isEntrega) {
      if (!this.endereco) {
        this.enderecoNovo();
      }
    } else {
      this.enderecoEdicao = false;
    }
  }

  selecionaPagamento(forma: { forma: number; nome: string }) {
    this.formaPagamento = forma;
  }

  finalizar() {
    if (this.isDelivery) {
      if (this.isEntrega && !this.endereco) {
        this._apiService.exibeErro('Cadastre o endereço de entrega para finalizar');
        this.enderecoNovo();
        return;
      }
      if (this.isEntrega && this.foraDeArea) {
        this._apiService.exibeErro('Endereço fora da área de entrega. Troque para retirada no balcão.');
        return;
      }
      if (!this.formaPagamento) {
        this._apiService.exibeErro('Selecione a forma de pagamento');
        return;
      }
      this._ecommerceService.confirma({
        entregaTipo: this.entregaTipo,
        formaPagamento: this.formaPagamento,
        frete: this.freteExibido,
      });
      return;
    }
    this._ecommerceService.confirma();
  }

  get enderecoResumo(): string {
    return this._ecommerceService.enderecoResumo(this.endereco);
  }

  enderecoNovo() {
    this.enderecoForm = this.endereco
      ? Object.assign(new Endereco(), this.endereco)
      : new Endereco();
    this.enderecoEdicao = true;
  }

  enderecoEdita() {
    this.enderecoForm = Object.assign(new Endereco(), this.endereco);
    this.enderecoEdicao = true;
  }

  enderecoCancela() {
    this.enderecoEdicao = false;
  }

  enderecoSalva() {
    if (!this.enderecoValida(this.enderecoForm)) {
      return;
    }
    this._ecommerceService.enderecoSalva(this.enderecoForm);
    this.enderecoEdicao = false;
  }

  cepBusca(avisar: boolean = false) {
    const cep = (this.enderecoForm.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) {
      if (avisar) {
        this._apiService.exibeErro('CEP deve ter 8 digitos');
      }
      return;
    }
    this.cepBuscando = true;
    this._ecommerceService.enderecoBuscaCep(cep).subscribe(dado => {
      this.cepBuscando = false;
      if (!dado) {
        this._apiService.exibeInformacao('CEP nao encontrado');
        return;
      }
      this.enderecoForm.logradouro = dado.logradouro || this.enderecoForm.logradouro;
      this.enderecoForm.bairro = dado.bairro || this.enderecoForm.bairro;
      this.enderecoForm.cidade = dado.cidade || this.enderecoForm.cidade;
      this.enderecoForm.uf = dado.uf || this.enderecoForm.uf;
    });
  }

  private enderecoValida(endereco: Endereco): boolean {
    if (!endereco.cep) {
      this._apiService.exibeErro('Informe o CEP');
      return false;
    }
    if (!endereco.logradouro) {
      this._apiService.exibeErro('Informe o logradouro');
      return false;
    }
    if (!endereco.numero) {
      this._apiService.exibeErro('Informe o número');
      return false;
    }
    if (!endereco.bairro) {
      this._apiService.exibeErro('Informe o bairro');
      return false;
    }
    if (!endereco.cidade) {
      this._apiService.exibeErro('Informe a cidade');
      return false;
    }
    if (!endereco.uf) {
      this._apiService.exibeErro('Informe a UF');
      return false;
    }
    return true;
  }

  voltarParaCardapio() {
    const empresaId: string = this._ecommerceService.empresa.id;
    const estabelecimentoId: string = this._ecommerceService.estabelecimento.id;
    const localizador = this._ecommerceService.localizador;
    if (localizador) {
      this._router.navigate([`/apps/e-commerce/shop/${empresaId}/${estabelecimentoId}/${localizador.id}`]);
      return;
    }
    this._router.navigate([`/apps/e-commerce/shop/${empresaId}/${estabelecimentoId}`]);
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
