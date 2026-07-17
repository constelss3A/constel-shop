# CLAUDE.md - Manual operacional do agente para o projeto Constel Shop

Este arquivo orienta qualquer agente de IA (Claude) que trabalhe neste repositorio.
Leia este arquivo por inteiro antes de qualquer tarefa e siga-o sem excecao.

---

## 0. Regra de ouro: sempre explicar o que esta fazendo

Antes de cada acao relevante (criar arquivo, alterar codigo, rodar comando, commitar),
escreva em portugues e em linguagem simples:

1. O que vai fazer.
2. Por que vai fazer (qual parte do pedido isso atende).
3. Quais arquivos/areas serao tocados.

Depois de executar, resuma o que mudou e qual e o proximo passo.
Nada de alteracoes silenciosas. Tarefas com varios passos: narre passo a passo.

---

## 1. Regras invariaveis (NUNCA quebrar)

- NAO usar emoji em nada (codigo, comentarios, UI textual, commits).
- NUNCA fazer commit com assinatura, co-author ou mencao a "Claude"/"AI"/"Generated with".
  Mensagem de commit limpa, no padrao do repo.
- Ha acesso ao backend real (sirius-s), e delivery esta EM PRODUCAO gravando pedido. O que
  ainda e mock: a config de taxa e o endereco do cliente, ambos em `localStorage`. Mocks
  isolados e com a MESMA assinatura da chamada real (retornando Observable/Promise), para a
  troca por API ser localizada, sem mexer na UI.
- O ambiente (constel.shop / sirius-s) e de TESTE: pode criar pedido de verdade para
  investigar. Sondar o `pedido/grava` e legitimo - as mensagens de validacao do backend
  entregam o schema campo a campo, e um 400 nao cria nada.
- Seguir o padrao do projeto: mesma forma de criar classes/objetos, mesma nomenclatura,
  mesma estrutura de pastas. Em duvida, copiar um arquivo equivalente e adaptar.
- Nao introduzir dependencias novas sem perguntar.
- Mudancas em delivery sao ADITIVAS: nao podem quebrar o fluxo de mesa (QR) em producao.
- Nao fazer commit sem o usuario pedir. Quando pedir, mensagem limpa e sem assinatura.

---

## 2. Stack e arquitetura

- Angular 14.1.0 (TypeScript), SPA. Base de template estilo Vuexy (pastas `@core`, `@fake-db`).
- UI: ng-bootstrap (NgbModule), ngx-toastr (toasts), ngx-swiper-wrapper, ng2-nouislider,
  CoreSidebar/CoreTouchspin do `@core`. Icones: feather (`data-feather`).
- Estado: servicos com `BehaviorSubject` expostos como `onXxxChange` (padrao observable).
- Dados: tudo passa pelo `ApiService` (`src/app/modulos/api.service.ts`).
- Login: `AuthenticationService` (`app/auth/service`), com login Google ja integrado no checkout.

Estrutura relevante:

```
src/app/
  modulos/                      # DOMINIO (em portugues)
    api.service.ts              # camada de dados (encontra/obtem/grava/adiciona/edita/exclui)
    administrativo/empresa, estabelecimento, corporacao
    recurso/item, categoria, unidade
    venda/localizador/          # localizador.ts (Mesa/Comanda) + cliente/cliente.ts
    venda/entrega/              # endereco.ts, endereco-validacao.ts, taxa-entrega*.ts
    integracao/pedido/          # pedido.ts + pedido-item.ts
    movimento/modalidade
  main/apps/ecommerce/          # A LOJA (shop, details, checkout, confirma)
    ecommerce.module.ts         # rotas do e-commerce
    ecommerce.service.ts        # orquestra empresa/estabelecimento/localizador/cardapio/sacola + confirma()
    modelo/                     # cardapio.ts, product.ts, sacola.ts
    ecommerce-shop/             # vitrine do cardapio
    ecommerce-checkout/         # confirmacao do pedido (login Google)
    ecommerce-details/, ecommerce-item/, ecommerce-confirma/
  auth/, layout/, menu/
```

---

## 3. Convencoes de codigo (extraidas do projeto - seguir a risca)

- Modelos de dados puros: `export type Xxx = { ... }` (ex.: `Cardapio`, `CardapioItem`).
- Modelos com comportamento / entidades: `export class Xxx { ... }` com campos publicos,
  sem construtor, metodos com verbo NO FIM (ex.: `totalAtualiza()`, `linhaAtualizaQuantidade()`,
  `sacolaIdentifica()`). Classe PascalCase; campos e metodos em portugues minusculo.
- Enums: nome PascalCase, membros PascalCase com valores numericos
  (ex.: `PedidoTipo.Delivery = 210`, `LocalizadorTipo.Mesa = 110`).
- Modelos ficam em `app/modulos/<area>/<entidade>/<entidade>.ts`.
- Servicos: `@Injectable({ providedIn: 'root' })`, dependencias privadas no construtor,
  estado publicado via `BehaviorSubject` `onXxxChange` e atualizado com `.next(...)`.
- Acesso a dados pelo `ApiService` usando URIs com esquema:
  `aps://...` (mapeado por `environment.aps`), `replica://...`, `http(s)://...`.
  Metodos: `encontra`, `obtem`, `lista`, `adiciona`, `edita`, `grava`, `exclui`, `envia`.
- Validacao de formulario reativo: `apiService.valida(formGroup)`. Em formularios
  template-driven, validar manualmente e usar `apiService.exibeErro(...)`.
- Mensagens ao usuario: `apiService.exibeSucesso/exibeErro/exibeInformacao`.
- Persistencia local (chave/valor): `apiService.getStorageData(secao, chave)` /
  `apiService.setStorageData(secao, chave, dado)` (localStorage, JSON).
- Rotas resolvem dados com `EcommerceService` (Resolve) antes de abrir a tela.
- Formularios template-driven: `ngModel` com `[ngModelOptions]="{ standalone: true }"` quando
  fora de um `<form>`. O `EcommerceModule` importa `FormsModule`.

---

## 4. Dominio: como o pedido funciona hoje

- Rotas atuais (`ecommerce.module.ts`):
  - `shop/:empresaid/:estabelecimentoid/:localizadorid`
  - `confirma/:empresaid/:estabelecimentoid/:localizadorid`
- `EcommerceService.resolve()` le os params, monta uma `Sacola` nova e carrega
  empresa, estabelecimento, localizador e cardapio (via `aps://integracao/cardapio/...`).
- `getLocalizador()` ja trata ausencia: sem `localizadorId`, `this.localizador = null` e `{ ok: false }`.
  Ou seja, o SERVICE ja aguenta ficar sem localizador; o que falta e a ROTA aceitar a URL
  sem o terceiro segmento.
- `Sacola` (modelo/sacola.ts): `linhas`, `quantidade`, `total`, com `adiciona/remove/
  linhaAtualizaQuantidade/identifica/totalAtualiza`. Cliente da sacola: `SacolaCliente`.
- `confirma()` monta um `Pedido`:
  - `tipo = PedidoTipo.Autoatendimento`; se houver localizador, usa `localizador.tipo`.
  - preenche empresa/estabelecimento/localizador, `pedidoCliente`, itens, `subtotal`,
    `frete = 0.00`, `total`, e grava em `aps://integracao/pedido/grava`.
- `Pedido` (modulos/integracao/pedido/pedido.ts): tem `frete`, `referencia`, `pedidoCliente`,
  `localizador`, mas NAO tem endereco de entrega ainda.
- `PedidoTipo` JA inclui `Delivery = 210` e `Encomenda = 220`.
- `LocalizadorTipo`: `Mesa = 110`, `Comanda = 120`.
- `voltarParaCardapio()` vive no service e passa por `cardapioRota()` (`modelo/rota.ts`), que
  trata delivery (sem localizador). Nao voltar a exigir localizador ali: e o que fazia o
  cliente de entrega ficar preso no checkout depois de confirmar.

---

## 5. Regra de roteamento: MESA vs DELIVERY

Formato: `/apps/e-commerce/shop/{empresaid}/{estabelecimentoid}/{localizadorid?}`

- COM `localizadorid` -> modo MESA (QR). Comportamento atual, intacto.
- SEM `localizadorid` -> modo DELIVERY: exigir cadastro de endereco antes de finalizar.

O modo deve ser dado no service por `get isDelivery()` (= `!this.localizadorId`).
O nome real do parametro no projeto e `localizadorid` (nao "mesa"/"table").

---

## 6. Feature de delivery (IMPLEMENTADA E EM PRODUCAO) - onde mexer

> O schema abaixo foi levantado sondando o `pedido/grava` real. O backend JA suportava
> delivery: recusava com "informacoes de entrega requeridas" porque o front mandava campos
> com nome inventado. O que ele espera:
>
>     pedidoEntrega (NAO "entrega")
>       cep, logradouro, bairro, uf : obrigatorios
>       municipio   : string (nao a entidade que o estabelecimento devolve)
>       local       : number - o numero do endereco
>       responsavel : number - significado desconhecido, mandamos 10
>       complemento : recusa string vazia, aceita ausente - omitir quando nao houver
>
>     pedidoPagamentos (array - NAO "pagamento" objeto)
>       sequencial, formaIdentificador, formaNome, total, trocoPara, pago
>
> `trocoPara` ja existia no backend, dentro do pagamento.
>
> Limites que o schema impoe: `referencia` no maximo 20 caracteres (nao cabe endereco - em
> mesa ele guarda o codigo do localizador); `pedidoCliente.identificador` minimo 10;
> `pedidoCliente.imagem` nao pode vazia; `pedidoCliente.email` minimo 8.

Comportamento esperado:
1. Entrar sem `localizadorid` -> `isDelivery == true` (`localizador == null`).
2. Sem endereco cadastrado -> checkout abre o formulario de endereco e bloqueia "finalizar".
3. Cadastrar e editar endereco; persistencia mock via storage.
4. Endereco vinculado ao pedido; `pedido.tipo = PedidoTipo.Delivery`.

Especificacao por arquivo:

A. `ecommerce.module.ts` - adicionar rotas de 2 segmentos (manter as de mesa):
   - `shop/:empresaid/:estabelecimentoid`
   - `confirma/:empresaid/:estabelecimentoid`
   Mesmo `component`, `resolve` e `data` das rotas de mesa correspondentes.

B. `modulos/venda/entrega/endereco.ts` - novo modelo `Endereco` (class), no estilo de `cliente.ts`:
   campos `id, apelido, cep, logradouro, numero, complemento, bairro, cidade, uf, pontoReferencia`.

C. `modulos/integracao/pedido/pedido.ts` - adicionar campo `entrega` (objeto inline, mesmo
   estilo dos blocos `empresa`/`localizador`) com:
   `cep, logradouro, numero, complemento, bairro, cidade, uf, pontoReferencia`.

D. `ecommerce.service.ts`:
   - importar `Endereco`; adicionar campo `endereco: Endereco` e `onEnderecoChange: BehaviorSubject<any>`
     (inicializar no construtor junto aos demais).
   - `get isDelivery(): boolean { return !this.localizadorId; }`.
   - `private enderecoChave()` => `endereco.${empresaId}.${estabelecimentoId}`.
   - `enderecoCarrega()`: se nao for delivery, `endereco = null`; senao ler de
     `getStorageData('delivery', enderecoChave())` (montar via `Object.assign(new Endereco(), dado)`);
     emitir `onEnderecoChange`.
   - `enderecoSalva(endereco)`: gerar `id` se vazio (timestamp), gravar com
     `setStorageData('delivery', enderecoChave(), endereco)`, emitir `onEnderecoChange`.
   - `enderecoResumo(endereco)`: string "logradouro, numero - complemento - bairro - cidade/uf".
   - no `resolve()`, dentro do bloco `if (hasContext)`, chamar `this.enderecoCarrega()`.
   - no `confirma()`, apos o bloco `if (this.localizador) {...}`, adicionar:
     se `isDelivery && endereco` -> `pedido.tipo = PedidoTipo.Delivery`, preencher `pedido.pedidoEntrega`
     a partir de `this.endereco`, e `pedido.referencia = enderecoResumo(this.endereco)`.

E. `ecommerce-checkout.component.ts`:
   - importar `Endereco` e `ApiService`; injetar `ApiService` no construtor.
   - campos: `isDelivery=false`, `endereco: Endereco`, `enderecoEdicao=false`,
     `enderecoForm: Endereco = new Endereco()`.
   - no `ngOnInit`: `isDelivery = ecommerceService.isDelivery`; assinar `onEnderecoChange`
     (so considerar endereco com `id`; se delivery e sem endereco, abrir o formulario).
   - metodos: `enderecoNovo`, `enderecoEdita`, `enderecoCancela`, `enderecoSalva`
     (valida e chama `ecommerceService.enderecoSalva`), `enderecoValida` (exige cep, logradouro,
     numero, bairro, cidade, uf; usa `exibeErro`), getter `enderecoResumo`.
   - `finalizar()`: se delivery e sem endereco -> `exibeErro` + abrir formulario + return; senao `confirma()`.
   - corrigir `voltarParaCardapio()`: navegar com localizador apenas se existir; senao rota de 2 segmentos.

F. `ecommerce-checkout.component.html`:
   - card "Endereco de entrega" visivel so com `isDelivery`, logo abaixo do cracha de localizador:
     resumo + botao Editar; estado "sem endereco" com botao Cadastrar; e o formulario template-driven
     (`ngModel` + `[ngModelOptions]="{ standalone: true }"`) com botoes Salvar/Cancelar.

G. `ecommerce-shop.component.ts` / `.html`:
   - getter `get isDelivery()` (delega ao service) e cracha "Delivery" no mesmo lugar do cracha de mesa.

Pontos deixados simples de proposito:
- `frete` continua `0.00` (sem regra de frete ainda).
- Validacao de CEP e apenas "preenchido" (sem mascara nem busca por CEP).

---

## 7. Estrategia de mocks (fase atual)

- Persistencia de endereco via `apiService.getStorageData('delivery', chave)` /
  `setStorageData('delivery', chave, endereco)`, chaveado por empresa+estabelecimento.
- Qualquer dado simulado deve passar por metodo de service com assinatura final
  (retornando Observable/Promise), para trocar por API depois sem mexer na UI.
- Simular loading/erro quando ajudar a UI a ja nascer preparada.

---

## 8. Fluxo de trabalho por tarefa

1. Analisar os arquivos relevantes e identificar o padrao a seguir.
2. Propor o plano (arquivos a criar/editar) e validar quando a mudanca for estrutural.
3. Implementar mockado, no padrao do projeto, sem emoji.
4. Rodar `ng build` (ou `npm run build`) e corrigir erros de compilacao.
5. Validar contra os criterios de aceite e mostrar o diff.
6. Resumir o que mudou e indicar o proximo passo.

---

## 9. Checklist antes de qualquer commit

- [ ] Sem emoji em qualquer arquivo alterado.
- [ ] Mensagem de commit sem assinatura/mencao a Claude/AI.
- [ ] `ng build` passa sem erros.
- [ ] Fluxo de mesa (com localizador) nao foi quebrado.
- [ ] Codigo segue nomenclatura e estrutura existentes.
- [ ] Mocks isolados e com assinatura pronta para API real.
- [ ] Commit so apos o usuario pedir.

---

## 10. Lista de tarefas (backlog) - TUDO PENDENTE

Implementacao do delivery (executar em ordem; detalhes na secao 6):
- [x] 1. Rotas sem localizador (shop e confirma de 2 segmentos) em `ecommerce.module.ts`.
- [x] 2. Criar modelo `Endereco` em `modulos/venda/entrega/endereco.ts`.
- [x] 3. Adicionar campo `entrega` ao `Pedido` (`modulos/integracao/pedido/pedido.ts`).
- [x] 4. No `ecommerce.service.ts`: `endereco` + `onEnderecoChange`, `get isDelivery()`,
        `enderecoChave/enderecoCarrega/enderecoSalva/enderecoResumo`.
- [x] 5. Chamar `enderecoCarrega()` no `resolve()` e tratar delivery no `confirma()`
        (`PedidoTipo.Delivery` + `pedido.pedidoEntrega` + `referencia`).
- [x] 6. Checkout `.ts`: estado e metodos de endereco, trava no `finalizar()`,
        correcao do `voltarParaCardapio()` para delivery.
- [x] 7. Checkout `.html`: card "Endereco de entrega" (resumo/editar ou formulario).
- [x] 8. Shop `.ts`/`.html`: `get isDelivery()` e cracha "Delivery".

Validacao:
- [x] Rodar `ng build` (ou `npm run build`) e corrigir erros de compilacao.
- [ ] Testar fluxo de MESA ponta a ponta (com localizador) - garantir que nao quebrou.
- [ ] Testar fluxo de DELIVERY ponta a ponta: entrar sem localizador, cadastrar endereco,
      editar endereco, bloquear finalizar sem endereco, confirmar pedido com tipo Delivery.

Evolucao da feature:
- [x] Regra de frete: taxa de entrega por raio (Haversine) com faixas mockadas por
      estabelecimento; origem e geocodificacao mockadas (assinatura final Observable);
      fora de area oferece retirada no balcao. Ver `docs/DISCOVERY-taxa-entrega-por-raio (1).md`.
      Arquivos: `modulos/venda/entrega/taxa-entrega.ts` (novo), `endereco.ts` (lat/lng),
      `ecommerce.service.ts` (estabelecimentoCoordenada/enderecoGeocodifica/distanciaCalcula/
      freteCalcula/freteRecalcula + onFreteChange), checkout `.ts`/`.html`.
      Pendente (integracao real): origem real do estabelecimento, provedor de geocodificacao
      com chave em `environment`, faixas via endpoint `aps://...`, frete gratis por subtotal.
- [x] Configuracao de taxa de entrega (4 tipos) + menu lateral. Tela em
      `apps/e-commerce/config-taxa-entrega` (item de menu "Taxa de entrega") com selecao de
      empresa/estabelecimento e edicao por tipo: Fixo, Dinamica (por km/faixas), Bairro
      (mapa Leaflet + ponto-em-poligono), Raio (aneis). Motor unico
      `modulos/venda/entrega/taxa-entrega-calculo.ts` (Haversine, ray casting, dispatcher por
      `TaxaTipo`); modelos em `taxa-entrega.ts`; service carrega/salva config por estabelecimento
      (`taxaEntregaConfigCarrega/Salva`, `onTaxaConfigChange`) e usa o motor no `freteRecalcula()`;
      geocoding via Photon (photon.komoot.io) com cache. NAO trocar por Nominatim: ele nao
      encontra os enderecos reais das unidades, que estao no OSM. Mapa: `leaflet` + `leaflet-draw`.
      Spec/plano em `docs/superpowers/`. Ver `docs/taxa-entrega-tipos.md`.
      Pendente (integracao real): endpoint de config (`aps://...`) no lugar do storage; dropdown
      real de empresa/estabelecimento; distancia por rota (Distance Matrix/OSRM); base GeoJSON de
      bairros pronta; import KML; substituir `window.prompt` do bairro por modal Angular.
- [x] Validacao de CEP: mascara e busca por CEP. Mascara em `endereco.ts` (`cepFormata`,
      `cepDigitos`, `cepValido`); busca automatica no oitavo digito com debounce de 500ms no
      checkout. ViaCEP direto do navegador.
- [x] Mostrar endereco e frete no resumo do pedido. O resumo lista como receber, endereco,
      forma de pagamento e troco abaixo do total (`.resumo-escolhas`).
- [x] Campos obrigatorios do endereco marcados com asterisco e erro no proprio campo, todos de
      uma vez (`endereco-validacao.ts`). A validacao antiga so avisava por toast e parava no
      primeiro erro - e sem o CSS do toastr (que so chegou no merge da master) o toast nao
      aparecia, entao o Salvar parecia nao fazer nada.
- [x] Troco no Dinheiro: "precisa de troco?" + valor, com os quatro estados no resumo
      (`troco-resumo.ts`). Vai em `pedidoPagamentos[0].trocoPara`.
- [ ] Multiplos enderecos por cliente: listar, escolher e definir endereco padrao (opcional).

Integracao (quando houver backend):
- [ ] **Endpoint de config da taxa. E o unico bloqueio real.** A config vive no `localStorage`
      de quem configura, entao NAO CHEGA NO CLIENTE: todo cliente paga o padrao hardcoded
      (Raio, 2km=R$5 / 5km=R$8 / 10km=R$12). A tela de config funciona, mas configura so o
      proprio navegador. Nomes no padrao do back: `aps://integracao/entrega/taxa/{estabId}`
      (ler, via `encontra`) e `aps://integracao/entrega/taxa/grava` (gravar, via `grava`).
      Aberto: o shop (`aps://`) pode gravar? Nao ha nenhuma escrita em `sirius-s` alem do
      `pedido/grava`. Se for read-only por design, a tela de config pertence a retaguarda.
- [ ] Persistir endereco vinculado ao cliente autenticado. Hoje e 1 endereco no `localStorage`
      por empresa+estabelecimento: some se o cliente trocar de navegador ou celular. O pedido
      ja manda `pedidoCliente.identificador` (login Google), entao a chave existe.

Perguntas para o backend (sobraram poucas, e sao especificas):
- [ ] **O que e `pedidoEntrega.responsavel`?** Mandamos `ENTREGA_RESPONSAVEL = 10` (constante
      no topo do `ecommerce.service.ts`) porque funciona. O campo e obrigatorio e aceita
      qualquer numero - testado com 999 e -1, os dois gravaram. Nao sabemos o significado nem
      os outros valores. Estamos carimbando todo pedido de delivery com um valor que nao
      entendemos, e o back aceita calado.
- [ ] `pedidoEntrega.local` e mesmo o numero do endereco? E number e aceitou 100; e o que faz
      sentido, mas nao foi confirmado.
- [ ] O frete deve ir como `pedido.frete` (hoje) ou como linha em `pedidoItens` com o item
      "Taxa de Entrega" (codigo 1010, id `6fa6ca36-cf35-4030-9b7a-6898f7757c07`, tipo 210,
      R$ 6,00 na tabela)? O `valor` que mandamos e gravado como veio - o back nao reimpoe o
      preco de tabela (verificado). O item e alcancavel pelo shop sem login.

Debitos e armadilhas conhecidas:
- [ ] `environment.prod.ts` so tem `apiUrl: 'http://localhost:4000'` - sem `api`/`apr`/`aps`.
      `npm run build:prod` falha com 8 erros. Producao funciona porque o deploy roda
      `ng build` sem configuracao (`defaultConfiguration` esta vazio no `angular.json`), o
      que tambem significa producao sem otimizacao e sem hash no bundle (`main.js`).
- [ ] Tela de config de taxa: ids fixos no `menu.ts` apontando para loja de teste. E prototipo;
      o link sai quando a tela migrar para a retaguarda, onde o contexto vem da sessao.
- [ ] `pedidoItem.item.nome` recebe o **id** do item (`confirma()` faz
      `pedidoItem.item.nome = linha.item.id`). Bug antigo, confirmado em pedido real gravado.
- [ ] Qualquer `input-group` com prepend fica torto neste tema: o grupo tem 48px cravados e o
      `.form-control` fica em 38px sem esticar. A tela de config usa `input-group` com "R$" nos
      valores das faixas - provavelmente esta torta la tambem (nao verificado).
- [ ] Geocoder: Photon (`photon.komoot.io`), instancia publica sem SLA. Para volume, self-host
      ou proxy no back - o modulo `xterno` ja existe na retaguarda (`api://xterno/cep/{cep}`,
      autenticado, entao o shop anonimo nao alcanca).
- [ ] Pedidos de teste criados no ambiente durante a descoberta do schema (7 no total, entre
      eles `d95996b7`, `602ade5c`, `25b03d9d`, `847361a7`, `845ce667`, `d4c6aea5`) - alguns com
      `responsavel` inventado (999, -1). Vale apagar.

Nao verificado (fazer com clique de gente, nao por automacao):
- [ ] Fluxo de MESA ponta a ponta - garantir que nao quebrou.
- [ ] Fluxo de DELIVERY ponta a ponta clicando: item, endereco, dinheiro com troco, confirmar,
      ver o toast e voltar ao cardapio. O `confirma()` grava 201 e o `cardapioRota()` tem teste,
      mas o ciclo completo nunca foi observado.
- [ ] Arrastar o pino na tela de taxa, salvar e recarregar: tem que voltar onde foi largado.
- [ ] O aviso vermelho de troco insuficiente renderizando (coberto por teste unitario).

> Nota sobre testar pelo navegador: dirigir esta app por JS de fora da zona do Angular mente.
> `.click()` e `router.navigate()` por console nao disparam change detection, e o
> `ng.getComponent` devolve o componente `:leave` da animacao `fadeIn` - que fica no DOM em
> `position: absolute` durante a transicao, ja destruido, reportando estado velho. Use clique
> de verdade e confie na tela, nao na inspecao.

Como manter esta lista:
- Marcar [x] ao concluir e mover itens novos para o grupo correto.
- Antes de iniciar um item, anunciar (regra da secao 0) o que sera feito e quais arquivos toca.
