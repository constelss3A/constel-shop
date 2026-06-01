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
- Fase atual e mockada: nao ha acesso ao backend. Mocks isolados e com a MESMA assinatura
  que a chamada real tera depois (retornando Observable/Promise), para a troca por API ser
  uma alteracao localizada, sem mexer na UI.
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
    venda/entrega/              # endereco.ts (modelo de delivery) - A CRIAR
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
- ATENCAO: `ecommerce-checkout.component.ts` -> `voltarParaCardapio()` acessa
  `this._ecommerceService.localizador.id` e QUEBRA no delivery; precisa ser protegido.

---

## 5. Regra de roteamento: MESA vs DELIVERY

Formato: `/apps/e-commerce/shop/{empresaid}/{estabelecimentoid}/{localizadorid?}`

- COM `localizadorid` -> modo MESA (QR). Comportamento atual, intacto.
- SEM `localizadorid` -> modo DELIVERY: exigir cadastro de endereco antes de finalizar.

O modo deve ser dado no service por `get isDelivery()` (= `!this.localizadorId`).
O nome real do parametro no projeto e `localizadorid` (nao "mesa"/"table").

---

## 6. Feature de delivery (A IMPLEMENTAR) - especificacao e onde mexer

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
     se `isDelivery && endereco` -> `pedido.tipo = PedidoTipo.Delivery`, preencher `pedido.entrega`
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
        (`PedidoTipo.Delivery` + `pedido.entrega` + `referencia`).
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
- [ ] Regra de frete: calcular `pedido.frete` (hoje fixo em 0.00) e exibir nos totais.
- [ ] Validacao de CEP: mascara e busca de endereco por CEP (autopreencher logradouro/bairro/cidade/uf).
- [ ] Mostrar endereco e frete no resumo do pedido (checkout) e na tela de confirmacao.
- [ ] Multiplos enderecos por cliente: listar, escolher e definir endereco padrao (opcional).

Integracao (quando houver backend):
- [ ] Trocar a persistencia mock (storage) por API real, mantendo a assinatura dos metodos.
- [ ] Persistir/recuperar endereco vinculado ao cliente autenticado.

Como manter esta lista:
- Marcar [x] ao concluir e mover itens novos para o grupo correto.
- Antes de iniciar um item, anunciar (regra da secao 0) o que sera feito e quais arquivos toca.
