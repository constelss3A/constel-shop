import { Component, OnInit } from '@angular/core';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { Empresa } from 'app/modulos/administrativo/empresa/empresa';
import { Estabelecimento } from 'app/modulos/administrativo/estabelecimento/estabelecimento';

@Component({
  selector: 'app-navbar-company',
  templateUrl: './navbar-company.component.html',
  styleUrls: ['./navbar-company.component.scss']
})
export class NavbarCompanyComponent implements OnInit {
  empresa: Empresa = null;
  estabelecimento: Estabelecimento  = null;

  constructor(
    private _ecommerceService: EcommerceService,
  ) { }

  ngOnInit(): void {
    this._ecommerceService.onEmpresaChange.subscribe(empresa => {
      this.empresa = empresa;
    });
    this._ecommerceService.onEstabelecimentoChange.subscribe(estabelecimento => {
      this.estabelecimento = estabelecimento;
    });
  }
}
