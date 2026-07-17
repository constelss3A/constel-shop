import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { AuthenticationService } from 'app/auth/service';
import { ApiService } from 'app/modulos/api.service';
import { Endereco, cepDigitos, cepFormata, cepValido } from 'app/modulos/venda/entrega/endereco';
import {
  EnderecoCampoObrigatorio, enderecoCampoFalta, enderecoCamposFaltando,
} from 'app/modulos/venda/entrega/endereco-validacao';
import { EntregaTipo, FormaPagamento, TrocoMotivo, TrocoResultado, trocoCalcula } from 'app/modulos/movimento/pagamento/pagamento';
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
  public enderecoFaltando: EnderecoCampoObrigatorio[] = [];
  public enderecoTentouSalvar = false;
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
  public FormaPagamento = FormaPagamento;
  public trocoNecessario = false;
  public trocoPara: number = null;

  private _unsubscribeAll = new Subject<void>();
  private googleReady = false;
  private cepDigitado = new Subject<string>();
  private cepBuscado = '';

  constructor(
    private _ecommerceService: EcommerceService,
    private _authenticationService: AuthenticationService,
    private _apiService: ApiService,
    private _ngZone: NgZone,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.isDelivery = this._ecommerceService.isDelivery;

    this.cepDigitado
      .pipe(
        map(cep => cepDigitos(cep)),
        filter(cep => cepValido(cep)),
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this._unsubscribeAll),
      )
      .subscribe(() => this.cepBusca());

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
    if (this.isDinheiro) {
      this.trocoNecessario = true;
      return;
    }
    // Trocar de forma zera o troco, senao o pedido sai com troco de uma escolha abandonada.
    this.trocoNecessario = false;
    this.trocoPara = null;
  }

  trocoNaoPrecisaMuda(evento: Event) {
    this.trocoNecessarioDefine(!(evento.target as HTMLInputElement).checked);
  }

  get isDinheiro(): boolean {
    return this.formaPagamento?.forma === FormaPagamento.Dinheiro;
  }

  pagamentoIcone(forma: number): string {
    switch (forma) {
      case FormaPagamento.Pix: return 'icon-zap';
      case FormaPagamento.CartaoCredito: return 'icon-credit-card';
      case FormaPagamento.CartaoDebito: return 'icon-credit-card';
      case FormaPagamento.Dinheiro: return 'icon-dollar-sign';
      default: return 'icon-circle';
    }
  }

  trocoNecessarioDefine(necessario: boolean) {
    this.trocoNecessario = necessario;
    if (!necessario) {
      this.trocoPara = null;
    }
  }

  get troco(): TrocoResultado {
    return trocoCalcula(this.trocoPara, this.total);
  }

  get trocoInsuficiente(): boolean {
    return this.trocoNecessario && this.troco.motivo === TrocoMotivo.Insuficiente;
  }

  get trocoExibido(): boolean {
    return this.trocoNecessario && this.troco.valido;
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
      if (this.isDinheiro && this.trocoNecessario && !this.troco.valido) {
        this._apiService.exibeErro(
          this.troco.motivo === TrocoMotivo.Insuficiente
            ? 'O valor do troco precisa ser maior que o total do pedido'
            : 'Informe para quanto precisa de troco'
        );
        return;
      }
      this._ecommerceService.confirma({
        entregaTipo: this.entregaTipo,
        formaPagamento: this.formaPagamento,
        frete: this.freteExibido,
        trocoPara: this.isDinheiro && this.trocoNecessario ? this.trocoPara : null,
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
    this.enderecoErrosLimpa();
  }

  enderecoEdita() {
    this.enderecoForm = Object.assign(new Endereco(), this.endereco);
    this.enderecoEdicao = true;
    this.enderecoErrosLimpa();
  }

  enderecoCancela() {
    this.enderecoEdicao = false;
    this.enderecoErrosLimpa();
  }

  private enderecoErrosLimpa() {
    this.enderecoTentouSalvar = false;
    this.enderecoFaltando = [];
  }

  enderecoSalva() {
    this.enderecoTentouSalvar = true;
    this.enderecoFaltando = enderecoCamposFaltando(this.enderecoForm);
    if (this.enderecoFaltando.length) {
      return;
    }
    this._ecommerceService.enderecoSalva(this.enderecoForm);
    this.enderecoEdicao = false;
    this.enderecoTentouSalvar = false;
  }

  // So marca depois da primeira tentativa: abrir o formulario todo vermelho nao ajuda.
  enderecoErro(campo: keyof Endereco): boolean {
    return this.enderecoTentouSalvar && enderecoCampoFalta(this.enderecoFaltando, campo);
  }

  cepMuda(valor: string): void {
    this.enderecoForm.cep = cepFormata(valor);
    this.cepDigitado.next(this.enderecoForm.cep);
  }

  cepBusca(avisar: boolean = false) {
    const cep = cepDigitos(this.enderecoForm.cep);
    if (!cepValido(cep)) {
      if (avisar) {
        this._apiService.exibeErro('CEP deve ter 8 digitos');
      }
      return;
    }
    if (cep === this.cepBuscado) {
      return;
    }
    this.cepBuscado = cep;
    this.cepBuscando = true;
    this._ecommerceService.enderecoBuscaCep(cep).subscribe(dado => {
      this.cepBuscando = false;
      if (!dado) {
        this.cepBuscado = '';
        this._apiService.exibeInformacao('CEP nao encontrado');
        return;
      }
      this.enderecoForm.logradouro = dado.logradouro || this.enderecoForm.logradouro;
      this.enderecoForm.bairro = dado.bairro || this.enderecoForm.bairro;
      this.enderecoForm.cidade = dado.cidade || this.enderecoForm.cidade;
      this.enderecoForm.uf = dado.uf || this.enderecoForm.uf;
    });
  }


  voltarParaCardapio() {
    this._ecommerceService.voltarParaCardapio();
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
