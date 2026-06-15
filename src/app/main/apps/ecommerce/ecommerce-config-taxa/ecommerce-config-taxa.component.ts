import { AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { ApiService } from 'app/modulos/api.service';
import {
  TaxaArredondamento, TaxaBairro, TaxaEntregaConfig, TaxaTipo, taxaEntregaConfigPadrao,
} from 'app/modulos/venda/entrega/taxa-entrega';

const iconRetina = '/assets/leaflet/marker-icon-2x.png';
const iconUrl = '/assets/leaflet/marker-icon.png';
const shadowUrl = '/assets/leaflet/marker-shadow.png';

@Component({
  selector: 'app-ecommerce-config-taxa',
  templateUrl: './ecommerce-config-taxa.component.html',
  styleUrls: ['./ecommerce-config-taxa.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ecommerce-application' },
})
export class EcommerceConfigTaxaComponent implements OnInit, AfterViewInit, OnDestroy {
  public contentHeader: object;
  public TaxaTipo = TaxaTipo;
  public TaxaArredondamento = TaxaArredondamento;
  public empresaId = '';
  public estabelecimentoId = '';
  public carregado = false;
  public config: TaxaEntregaConfig = taxaEntregaConfigPadrao();

  public tipos = [
    { tipo: TaxaTipo.Fixo, nome: 'Fixo', icone: 'icon-tag', descricao: 'Valor unico para toda a area de entrega' },
    { tipo: TaxaTipo.Dinamica, nome: 'Dinamica', icone: 'icon-trending-up', descricao: 'Valor base mais acrescimo por km' },
    { tipo: TaxaTipo.Bairro, nome: 'Bairro', icone: 'icon-map', descricao: 'Poligonos por bairro desenhados no mapa' },
    { tipo: TaxaTipo.Raio, nome: 'Raio', icone: 'icon-target', descricao: 'Aneis por distancia a partir da loja' },
  ];

  public faixaRaioConfig: number | null = null;

  get tipoLabel(): string {
    const atual = this.tipos.find(t => t.tipo === this.config.tipo);
    return atual ? atual.nome : '';
  }

  faixaRaioConfigToggle(i: number): void {
    this.faixaRaioConfig = this.faixaRaioConfig === i ? null : i;
  }

  private mapa: L.Map;
  private origemMarker: L.Marker;
  private aneis: L.Circle[] = [];
  private bairroLayer: L.FeatureGroup;

  constructor(
    private _ecommerceService: EcommerceService,
    private _apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.contentHeader = {
      headerTitle: 'Taxa de entrega',
      actionButton: false,
      breadcrumb: {
        type: '',
        links: [
          { name: 'Home', isLink: false, link: '/' },
          { name: 'eCommerce', isLink: false, link: '/' },
          { name: 'Taxa de entrega', isLink: false },
        ],
      },
    };
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.mapa) { this.mapa.remove(); }
  }

  carrega(): void {
    if (!this.empresaId || !this.estabelecimentoId) {
      this._apiService.exibeErro('Informe empresa e estabelecimento');
      return;
    }
    this._ecommerceService.contextoDefine(this.empresaId, this.estabelecimentoId);
    const raw = this._ecommerceService.taxaEntregaConfigCarrega();
    this.config = {
      ...raw,
      origem: { ...raw.origem },
      faixasRaio: raw.faixasRaio.map(f => ({ ...f })),
      faixasDinamica: raw.faixasDinamica.map(f => ({ ...f })),
      bairros: raw.bairros.map(b => ({ ...b, poligono: b.poligono.map(p => ({ ...p })) })),
    };
    this.carregado = true;
    setTimeout(() => this.mapaInicia(), 0);
  }

  selecionaTipo(tipo: TaxaTipo): void {
    this.config.tipo = tipo;
    this.aneisAtualiza();
    setTimeout(() => this.mapaInicia(), 0);
  }

  faixaRaioAdiciona(): void {
    this.config.faixasRaio.push({ raioKm: 0, valor: 0, gratis: false });
    this.aneisAtualiza();
  }
  faixaRaioRemove(i: number): void {
    this.config.faixasRaio.splice(i, 1);
    this.faixaRaioConfig = null;
    this.aneisAtualiza();
  }
  faixaDinamicaAdiciona(): void {
    this.config.faixasDinamica.push({ ateKm: 0, valor: 0 });
  }
  faixaDinamicaRemove(i: number): void {
    this.config.faixasDinamica.splice(i, 1);
  }
  bairroAdiciona(): void {
    const id = Date.now().toString();
    this.config.bairros.push({ id, nome: '', valor: 0, ativo: true, poligono: [] });
  }
  bairroRemove(i: number): void {
    this.config.bairros.splice(i, 1);
    if (this.bairroLayer) { this.bairrosDesenhaExistentes(); }
  }

  salva(): void {
    if (!this.carregado) {
      this._apiService.exibeErro('Carregue um estabelecimento antes de salvar');
      return;
    }
    if (!this.valida()) {
      return;
    }
    this._ecommerceService.taxaEntregaConfigSalva(this.config);
    this._apiService.exibeSucesso('Configuracao salva');
  }

  private valida(): boolean {
    if (this.config.picoAtivo && !this.config.entregaGratis && !(this.config.picoMultiplicador > 0)) {
      this._apiService.exibeErro('Informe um multiplicador de pico maior que zero');
      return false;
    }
    if (this.config.entregaGratis) {
      return true;
    }
    if (this.config.tipo === TaxaTipo.Fixo && !(this.config.valor > 0)) {
      this._apiService.exibeErro('Informe o valor fixo');
      return false;
    }
    if (this.config.tipo === TaxaTipo.Raio && !this.config.faixasRaio.length) {
      this._apiService.exibeErro('Adicione ao menos uma faixa de raio');
      return false;
    }
    if (this.config.tipo === TaxaTipo.Dinamica && this.config.modoFaixa && !this.config.faixasDinamica.length) {
      this._apiService.exibeErro('Adicione ao menos uma faixa dinamica');
      return false;
    }
    if (this.config.tipo === TaxaTipo.Bairro && !this.config.bairros.some(b => b.ativo)) {
      this._apiService.exibeErro('Cadastre ao menos um bairro ativo');
      return false;
    }
    if (this.config.tipo === TaxaTipo.Dinamica && !this.config.modoFaixa) {
      if (!(this.config.kmMaximo > 0)) {
        this._apiService.exibeErro('Informe o km maximo para taxa dinamica');
        return false;
      }
      if (!(this.config.valorPorKm > 0)) {
        this._apiService.exibeErro('Informe o valor por km para taxa dinamica');
        return false;
      }
    }
    return true;
  }

  private mapaInicia(): void {
    if (this.mapa) { this.mapa.remove(); }
    const o = this.config.origem;
    this.mapa = L.map('config-taxa-mapa').setView([o.latitude, o.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.mapa);

    const markerIcon = L.icon({
      iconRetinaUrl: iconRetina,
      iconUrl: iconUrl,
      shadowUrl: shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    this.origemMarker = L.marker([o.latitude, o.longitude], { draggable: true, icon: markerIcon }).addTo(this.mapa);
    this.origemMarker.on('dragend', () => {
      const p = this.origemMarker.getLatLng();
      this.config.origem = { latitude: p.lat, longitude: p.lng };
      this.aneisAtualiza();
    });
    this.aneisAtualiza();

    this.bairroLayer = new L.FeatureGroup();
    this.mapa.addLayer(this.bairroLayer);
    this.bairrosDesenhaExistentes();

    if (this.config.tipo === TaxaTipo.Bairro) {
      const drawControl = new (L as any).Control.Draw({
        edit: { featureGroup: this.bairroLayer, edit: false, remove: true },
        draw: {
          polygon: true,
          marker: false,
          circle: false,
          rectangle: false,
          polyline: false,
          circlemarker: false,
        },
      });
      this.mapa.addControl(drawControl);
      this.mapa.on((L as any).Draw.Event.CREATED, (e: any) => {
        const latlngs = e.layer.getLatLngs()[0].map((p: any) => ({ latitude: p.lat, longitude: p.lng }));
        const nome = window.prompt('Nome do bairro') || `Bairro ${this.config.bairros.length + 1}`;
        const valorStr = window.prompt('Valor da entrega (R$)') || '0';
        const valor = parseFloat(valorStr.replace(',', '.')) || 0;
        const novoBairro: TaxaBairro = {
          id: Date.now().toString(),
          nome,
          valor,
          ativo: true,
          poligono: latlngs,
        };
        this.config.bairros.push(novoBairro);
        this.bairroLayer.addLayer(e.layer);
      });
    }
  }

  aneisAtualiza(): void {
    if (!this.mapa) { return; }
    this.aneis.forEach(a => this.mapa.removeLayer(a));
    this.aneis = [];
    if (this.config.tipo !== TaxaTipo.Raio) { return; }
    const o = this.config.origem;
    [...this.config.faixasRaio].sort((a, b) => b.raioKm - a.raioKm).forEach(f => {
      const c = L.circle([o.latitude, o.longitude], { radius: f.raioKm * 1000, color: '#7367f0', weight: 1 });
      c.addTo(this.mapa);
      this.aneis.push(c);
    });
  }

  private bairrosDesenhaExistentes(): void {
    if (!this.bairroLayer) { return; }
    this.bairroLayer.clearLayers();
    this.config.bairros.forEach(b => {
      if (!b.poligono.length) { return; }
      const poly = L.polygon(b.poligono.map(p => [p.latitude, p.longitude] as [number, number]), { color: '#28c76f' });
      poly.bindTooltip(`${b.nome} - R$ ${b.valor}`);
      this.bairroLayer.addLayer(poly);
    });
  }
}
