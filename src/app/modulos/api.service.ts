import { Injectable } from '@angular/core';
import { FormGroup, FormArray, FormControl, ValidationErrors, AbstractControl } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
// import { NgxSpinnerService } from 'ngx-spinner';

import { environment } from 'environments/environment';
import { AuthenticationService } from 'app/auth/service/authentication.service';
//import { Permissao } from './../auth/models/credencial';

type Paginacao<T> = {
  registros: number;
  linhas: number;
  pagina: number;
  paginas: number;
  lista: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private logAll = false;

  constructor(
    protected http: HttpClient,
    protected authentication: AuthenticationService,
    protected toastr: ToastrService,
    // protected spinnerService: NgxSpinnerService,
  ) { }

  getMapping(resource: string): string {
    if (!resource) {
      this.logx('Recurso não informado');
      return '';
    }
    if (resource.startsWith('http://') || resource.startsWith('https://')) {
      return resource;
    }
    if (resource.startsWith('replica://')) {
      return environment.apr + resource.split('//')[1];
    }
    if (resource.startsWith('aps://')) {
      return environment.aps + resource.split('//')[1];
    }
    if (resource.startsWith('/api/')) {
      return resource;
    }
    return environment.api + resource;
  }

  getArquivoUrl(arquivo: string): string {
    if (!arquivo)
      return null;
    if (arquivo.toLowerCase().startsWith('http://') || arquivo.toLowerCase().startsWith('https://'))
      return arquivo;
    return environment.api + 'arquivo/' + arquivo;
  }

  getDataSource(resource: string): Observable<any> {
    const url = this.getMapping(resource);
    this.logx(`GET: ${url}`);
    const inicio = new Date();
    return this.http
      .get(url)
      .pipe(
        tap(item => this.xnotificaConclusao('GET', 'Ok - lista recebida', inicio, item)),
        catchError(this.xnotificaErro('GET', 'lista')),
      );
  }

  elemento(resource: string): Observable<any> {
    const url = this.getMapping(resource);
    //this.logx(`GET: ${url}`);
    const inicio = new Date();
    return this.http
      .get(`${url}`)
      .pipe(
        tap(item => this.xnotificaConclusao(`GET: ${url}`, 'Ok - lista recebida', inicio, item)),
        catchError(error => this.notificaErro('GET', 'lista', error))
      );
  }

  lista<T>(resource: string, texto: string = '', filtro: string = ''): Observable<T[]> {
    var parametros = '';
    if (texto || filtro) {
      const condicoes: string[] = [];
      if (!filtro && texto.startsWith('$')) {
        if (texto.includes('=')) {
          condicoes.push(texto.substring(1));
          filtro = '';
          texto = '';
        }
        filtro = texto;
        texto = '';
      } else if (texto.includes('=')) {
        condicoes.push(texto);
        texto = '';
      }
      if (texto)
        condicoes.push('texto=' + texto);
      if (filtro) {
        if (!filtro.toLowerCase().startsWith('filtro=') && !filtro.includes('='))
          filtro = 'filtro=' + filtro;
        condicoes.push(filtro);
      }
      parametros = '?' + condicoes.join('&');
    }
    var url = '';
    if (!resource.startsWith('replica://')) {
      url = this.getMapping('replica://' + resource + parametros);
    } else {
      url = this.getMapping(resource + parametros);
    }
    //this.logx(`GET: ${url}`);
    const inicio = new Date();
    return this.http
      .get<T[]>(`${url}`)
      .pipe(
        tap(item => this.xnotificaConclusao(`GET: ${url}`, 'Ok - lista recebida', inicio, item)),
        catchError(error => this.notificaErro('GET', 'lista', error))
      );
  }

  listax<T>(resource: string, texto: string = '', filtro: string = ''): Observable<T[]> {
    var parametros = '';
    if (texto || filtro) {
      const condicoes: string[] = [];
      if (!filtro && texto.startsWith('$')) {
        if (texto.includes('=')) {
          condicoes.push(texto.substring(1));
          filtro = '';
          texto = '';
        }
        filtro = texto;
        texto = '';
      } else if (texto.includes('=')) {
        condicoes.push(texto);
        texto = '';
      }
      if (texto)
        condicoes.push('texto=' + texto);
      if (filtro) {
        if (!filtro.toLowerCase().startsWith('filtro='))
          filtro = 'filtro=' + filtro;
        condicoes.push(filtro);
      }
      parametros = '?' + condicoes.join('&');
    }
    var url = '';
    if (!resource.startsWith('replica://')) {
      url = this.getMapping('replica://' + resource + parametros);
    } else {
      url = this.getMapping(resource + parametros);
    }
    this.logx(`GET: ${url}`);
    const inicio = new Date();
    return this.http
      .get<T[]>(`${url}`)
      .pipe(
        tap(lista => this.xnotificaConclusao(`GET: ${url}`, 'Ok - lista recebida', inicio, lista)),
        catchError(error => this.notificaErro('GET', 'lista', error))
      );
  }

  tabela(resource: string, texto: string, filtro: string): Observable<any> {
    var parametros = '';
    if (texto || filtro) {
      const condicoes: string[] = [];
      if (texto)
        condicoes.push('texto=' + texto);
      if (filtro)
        condicoes.push(filtro);
      parametros = '?' + condicoes.join('&');
    }
    const url = this.getMapping(resource + '/tabela' + parametros);
    //this.logx(`GET: ${url}`);
    const inicio = new Date();
    return this.http
      .get(`${url}`)
      .pipe(
        tap(item => this.xnotificaConclusao(`GET: ${url}`, 'Ok - lista recebida', inicio, item)),
        catchError(error => this.notificaErro('GET', 'lista', error))
      );
  }

  planilha(resource: string, linhas: number, pagina: number, texto: string, filtro: string): Observable<any> {
    const condicoes: string[] = [];
    condicoes.push(`linhas=${linhas}`);
    condicoes.push(`pagina=${pagina}`);
    if (texto || filtro) {
      if (texto) {
        //condicoes.push('texto=' + texto);
        let valor: string = texto;
        if (texto.startsWith('#')) {
          valor = texto.slice(1);
        }
        if (valor !== null) {
          condicoes.push('texto=' + encodeURIComponent(valor));//decodifica para enviar o valor na requisição
        }
      }
      if (filtro) {
        condicoes.push(filtro);
      }
    }
    const url = this.getMapping('replica://' + resource + '/planilha?' + condicoes.join('&'));
    this.logx(`GET: ${url}`);
    const inicio = new Date();
    return this.http
      .get(`${url}`)
      .pipe(
        tap(data => this.xnotificaConclusao('GET', 'Ok - planilha recebida', inicio, data)),
        catchError(error => this.notificaErro('GET', 'lista', error))
      );
  }

  async planilhaCompleta<T, R = T[]>(
    resource: string,
    filtro: string = '',
    linhas: number = 1000
  ): Promise<Observable<T[]>> {
    const retorno: T[] = [];
    var pagina = 1;
    var paginas = 1;
    while (pagina <= paginas) {
      const fragmento = await this.planilha(resource, 2, pagina, '', filtro).toPromise();
      if (!fragmento.lista) {
        this.exibeErro('retorno inválido');
        return of([]);
      }
      const elementos = <T[]>fragmento.lista;
      retorno.push(...elementos);
      pagina = (+fragmento.pagina || 0) + 1;
      paginas = (+fragmento.paginas || 0);
    }
    return of(retorno);
  }

  relatorio(resource: string, agrupamento: string, filtro: string, pagina: number = 0, linhas: number = 0): Observable<any> {
    var parametros = '';
    const condicoes: string[] = [];
    if (agrupamento) {
      condicoes.push('agrupamento=' + agrupamento);
    }
    if (pagina) {
      condicoes.push('pagina=' + pagina);
    }
    if (linhas) {
      condicoes.push('linhas=' + linhas);
    }
    if (filtro) {
      condicoes.push(filtro);
    }
    if (condicoes.length) {
      parametros = '?' + condicoes.join('&');
    }
    const url = this.getMapping('replica://' + resource + parametros);
    this.logx(`GET: ${url}`);
    const inicio = new Date();
    return this.http
      .get(`${url}`)
      .pipe(
        tap(item => this.xnotificaConclusao(`GET: ${url}`, 'Ok - relatório recebido', inicio, item)),
        catchError(error => this.notificaErro('GET', 'dados', error)),
      );
  }

  atributos(resource: string): Observable<any> {
    const url = this.getMapping(resource + '/atributos');
    const inicio = new Date();
    return this.http
      .get(`${url}`)
      .pipe(
        tap(item => this.xnotificaConclusao(`GET: ${url}`, `Ok - ${url}`, inicio, item)),
        catchError(error => this.notificaErro('GET', `${url}`, error))
      );
  }

  obtem<T>(resource: string, id: string, sufixo: string = ''): Observable<T> {
    if (sufixo) {
      sufixo = '/' + sufixo;
    }
    const url = this.getMapping(resource);
    // this.logx(`GET: ${url}/${id}${sufixo}`);
    const inicio = new Date();
    return this.http
      .get<T>(`${url}/${id}${sufixo}`)
      .pipe(
        tap(item => this.xnotificaConclusao(`GET: ${url}/${id}${sufixo}`, `Ok - ${url}/${id}`, inicio, item)),
        catchError(error => this.notificaErro('GET', `${url}/${id}`, error))
      );
  }

  busca(resource: string, params: string): Observable<any> {
    params ??= '';
    const url = this.getMapping(resource + '?' + params);
    // this.logx(`> GET: ${url}`);
    const inicio = new Date();
    return this.http
      .get(`${url}`)
      .pipe(
        tap(item => this.xnotificaConclusao('GET', `Ok - ${url}`, inicio, item)),
        catchError(error => this.notificaErro('GET', `${url}`, error))
      );
  }

  async buscaPlanilha<T>(resource: string, params: string, mensagem: string): Promise<T> {
    params ??= '';
    const url = this.getMapping(resource + '/planilha?pagina=1&linhas=1&' + params);
    const inicio = new Date();
    const pagina = await this.http
      .get<Paginacao<T>>(`${url}`)
      .pipe(
        tap(item => this.xnotificaConclusao('GET', `Ok - ${url}`, inicio, item)),
        catchError(error => this.notificaErro('GET', `${url}`, error))
      ).toPromise();
    const [primeiro] = pagina.lista;
    if (!primeiro) {
      throw new Error(mensagem || 'nenhuma instância encontrato com essas condições');
    }
    return this.obtem<T>(resource, primeiro['id']).toPromise();
  }

  encontra<T>(resource: string, filtro: string): Observable<T> {
    const url = this.getMapping(resource);
    if (filtro) {
      filtro = '?' + filtro;
    }
    const inicio = new Date();
    return this.http
      .get<T>(`${url}${filtro}`)
      .pipe(
        tap(item => {
          if (item) {
            this.xnotificaConclusao(`GET: ${url}/${resource}?${filtro}`, `Ok - ${resource}/${filtro}`, inicio, item);
            return;
          }
          this.notificaErro('GET', `${url}/${resource}?${filtro}`, 'nenhuma instância encontrato com essas condições');
        }),
        catchError(error => this.notificaErro('GET', `${url}/${resource}?${filtro}`, error)),
      );
  }

  adiciona<T>(resource: string, instancia: any): Observable<T> {
    const url = this.getMapping(resource);
    this.logx(`POST: ${url}`);
    this.logx('Objeto: ' + JSON.stringify(instancia));
    const inicio = new Date();
    return this.http
      .post<T>(`${url}`, instancia)
      .pipe(
        tap(item => this.xnotificaConclusao('POST', `Ok - ${url} incluído`, inicio, item)),
        catchError(error => this.notificaErro('POST', `${url}`, error, instancia))
      );
  }

  edita<T>(resource: string, id: string, instancia: any, notifica: boolean = true): Observable<T> {
    const url = this.getMapping(resource);
    this.logx(`PUT: ${url}`);
    this.logx('Objeto: ' + JSON.stringify(instancia));
    const inicio = new Date();
    return this.http
      .put<T>(`${url}/${id}`, instancia)
      .pipe(
        tap(item => notifica && this.xnotificaConclusao('PUT', `Ok - ${url}/${id} editado`, inicio, item)),
        catchError(err => this.errorHandler('PUT', `${url}/${id}`, err))
      );
  }

  grava<T>(resource: string, instancia: any, notifica: boolean = true): Observable<T> {
    const url = this.getMapping(resource);
    this.logx(`POST: ${url}`);
    //this.logx('Objeto: ' + JSON.stringify(instancia));
    const inicio = new Date();
    return this.http
      .post<T>(`${url}`, instancia)
      .pipe(
        tap(item => {
          if (notifica)
            this.xnotificaConclusao(`POST: ${url}`, `Ok - ${url} gravação concluída`, inicio, item);
        }),
        catchError(error => this.errorHandler('POST', `${url}`, error))
      );
  }

  envia<T>(resource: string, instancia: any, notifica: boolean = true): Observable<T> {
    const url = this.getMapping(resource);
    this.logx(`POST: ${url}`);
    const inicio = new Date();
    return this.http
      .post<T>(`${url}`, instancia)
      .pipe(
        tap(item => {
          if (notifica)
            this.xnotificaConclusao(`POST: ${url}`, `Ok - ${url} envio concluído`, inicio, item);
        }),
        catchError(error => this.errorHandler('POST', `${url}`, error))
      );
  }

  exclui(resource: string, id: string, notifica: boolean = true): Observable<any> {
    const url = this.getMapping(resource);
    this.logx(`DELETE: ${url}/${id}`);
    const inicio = new Date();
    return this.http
      .delete(`${url}/${id}`, { responseType: 'text' })
      .pipe(
        tap(item => {
          if (notifica)
            this.xnotificaConclusao(`DELETE: ${url}/${id}`, `Ok - ${url}/${id} excluído`, inicio, item);
        }),
        catchError(error => this.notificaErro('DELETE', `${url}/${id}`, error))
      );
  }

  requisita<T>(resource: string, instancia: any, notifica: boolean = true): Observable<T> {
    const url = this.getMapping(resource);
    this.logx(`POST: ${url}`);
    const inicio = new Date();
    return this.http
      .post<T>(`${url}`, instancia)
      .pipe(
        catchError(err => this.errorHandler('POST', `${url}`, err))
      );
  }

  upload(fileToUpload: File): Observable<any> {
    const url = this.getMapping('arquivo/envia');
    const formData: FormData = new FormData();
    formData.append('arquivo', fileToUpload, fileToUpload.name);
    this.logx(`Upload - POST: ${url}`);
    this.logx('Upload - Objeto: ' + JSON.stringify(formData));
    const inicio = new Date();
    return this.http
      .post(url, formData)
      .pipe(
        tap(item => this.xnotificaConclusao('POST', `Ok - ${url}`, inicio, item)),
        catchError(this.xnotificaErro('POST', `${url}`))
      );
  }

  uploadFiscal(fileToUpload: File): Observable<any> {
    const url = this.getMapping('fiscal://fiscal/arquivo/envia');
    const formData: FormData = new FormData();
    formData.append('certificado', fileToUpload, fileToUpload.name);
    this.logx(`Upload - POST: ${url}`);
    this.logx('Upload - Objeto: ' + JSON.stringify(formData));
    const inicio = new Date();
    return this.http
      .post(url, formData)
      .pipe(
        tap(item => this.xnotificaConclusao('POST', `Ok - ${url}`, inicio, item)),
        catchError(this.xnotificaErro('POST', `${url}`))
      );
  }

  post(resource: string, id: string, suffix: string, instancia: any): Observable<any> {
    const url = this.getMapping(resource);
    this.logx(`PUT: ${url}`);
    this.logx('Objeto: ' + JSON.stringify(instancia));
    const inicio = new Date();
    return this.http
      .put(`${url}/${id}/${suffix}`, instancia)
      .pipe(
        tap(item => this.xnotificaConclusao('PUT', `Ok - ${url}/${id}/${suffix} editado`, inicio, item)),
        catchError(this.xnotificaErro('PUT', `${url}/${id}`))
      );
  }

  obtemArquivoTexto(resource: string): Observable<any> {
    const url = this.getMapping(resource);
    const headers = new HttpHeaders();
    headers.set('Accept', '*/*');
    const inicio = new Date();
    return this.http
      .get(`${url}`, { headers: headers, responseType: 'blob' })
      .pipe(
        tap(item => this.xnotificaConclusao('GET', `Ok - ${url}`, inicio, item)),
        catchError(error => this.notificaErro('GET', `${url}`, error))
      );
  }

  envioVendaStatix(resource: any, instancia: any, notifica: boolean = true): Observable<any> {
    const url = this.getMapping(resource);
    this.logx(`POST: ${url}`);
    this.logx('Objeto: ' + JSON.stringify(instancia));
    const inicio = new Date();
    return this.http
      .post<any>(`${url}`, instancia)
      .pipe(
        tap(item => {
          if (item && notifica)
            this.xnotificaConclusao('POST', `Ok - ${url} registrado`, inicio, item)
        }),
        catchError(error =>
          this.notificaErro('POST', `${url}`, error, instancia)
        )
      );
  }

  consultaVendaStatix(resource: string, data: any): Observable<any> {
    const url = this.getMapping(resource);
    //this.logx(`GET: ${url}`);
    const inicio = new Date();
    return this.http
      .get(`${url}`)
      .pipe(
        tap(item => this.xnotificaConclusao(`GET: ${url}`, 'Ok - lista recebida', inicio, item)),
        catchError(error => this.notificaErro('GET', 'lista', error))
      );
  }

  notificaSucesso(mensagem: string) {
    //this.notification.success(mensagem);
    this.logx('sucesso ' + mensagem);
  }

  notificaAlerta(mensagem: string) {
    //this.notification.warn(mensagem);
    this.logx('alerta ' + mensagem);
  }

  exibeInformacao(mensagem: string) {
    this.toastr.info(
      mensagem,
      'Informação',
      {
        toastClass: 'toast ngx-toastr',
        timeOut: 24000,
        progressBar: true,
        closeButton: true,
      }
    );
  }

  exibeSucesso(mensagem: string, timeOut: number = null) {
    if (!timeOut) {
      timeOut = 24000;
    }
    if (timeOut && (timeOut < 1000)) {
      timeOut *= 1000;
    }
    this.toastr.success(
      mensagem,
      'Sucesso',
      {
        toastClass: 'toast ngx-toastr',
        timeOut: timeOut,
        progressBar: true,
        closeButton: true,
      }
    );
  }

  exibeErro(mensagem: string) {
    this.toastr.error(
      mensagem,
      'Exceção',
      {
        toastClass: 'toast ngx-toastr',
        timeOut: 24000,
        progressBar: true,
        closeButton: true,
      }
    );
  }

  protected xnotificaConclusao(requestString: string, message: string, inicio: Date, value: any) {
    const diferenca = new Date().getTime() - inicio.getTime();
    var method = '';
    if (requestString.includes(':'))
      method = requestString.substring(0, requestString.indexOf(':'));
    else
      method = requestString;
    if (requestString.startsWith('GET')) { // GET não grava no log, nem exibe mensagem
      if (!value) {
        this.logx(`${requestString}: ${message}: nulo - ${diferenca} ms`);
        return;
      }
      if (value.length) {
        this.logx(`${requestString}: ${message}: ${value.length} registro(s) - ${diferenca} ms`);
        return;
      }
      this.logx(`${requestString}: ${message} - ${diferenca} ms`);
      return;
    }
    this.logx(`${requestString}: ${message} - ${diferenca} ms`);
    var nome = value?.nome;
    if (nome)
      nome = ' ' + nome;
    else
      nome = '';
    const options = {
      toastClass: 'toast ngx-toastr',
      closeButton: true
    };
    switch (method) {
      case 'POST':
        this.toastr.success('Gravação concluída' + nome, 'Sucesso', options);
        this.logx('Inclusão concluída');
        return;
      case 'PUT':
        this.toastr.success('Edição concluída' + nome, 'Sucesso', options);
        this.logx('Edição concluída');
        return;
      case 'DELETE':
        this.toastr.info('Exclusão concluída' + nome, 'Sucesso', options);
        this.logx('Exclusão concluída');
        return;
    }
    this.toastr.info(`${method}: ${message}${nome}`, 'Sucesso', options);
    this.logx(`sucesso ${method}: ${message}`);
  }

  protected notificaErro(method: string, operation: string, error: any, instancia: any = null) {
    var mensagem = error.toString();
    if (mensagem === 'Unknown Error')
      return;
    mensagem = mensagem.replace('should not be empty', 'requerido');
    mensagem =
      'A requisição falhou devido ao seguinte motivo: '
      + mensagem
      + `\n${method}: ${operation}`;
    this.logx(mensagem);
    if (instancia) {
      console.error('instância');
      console.dir(instancia);
    }
    this.toastr.error(
      mensagem,
      'Atenção!',
      {
        toastClass: 'toast ngx-toastr',
        timeOut: 24000,
        progressBar: true,
        closeButton: true,
      }
    );
    this.desbloqueia();
    return throwError(mensagem);
  }

  protected xnotificaErro(method: string, operation: string) {
    return function errorHandler(res: HttpErrorResponse) {
      console.error(`notifica erro ${method}: ${operation}`);
      console.error(res);
      switch (res.status) {
        case 400: {
          operation += '\n * Erro 400, requisição inválida';
          break;
        }
        case 403: {
          operation += '\n * Erro 403, não permitido';
          break;
        }
        case 404: {
          operation += '\n * Erro 404, não encontrado';
          break;
        }
      }
      if (res.message)
        operation += '\n' + res.message;
      console.error(operation);
    }.bind(this);
  }

  errorHandler(method: string, operation: string, error: any) {
    console.error('error');
    console.dir(error);
    var mensagem = '';
    if (typeof (error) === 'string') {
      mensagem = error.toString().replace('should not be empty', 'requerido');
    } else if (typeof (error) === 'object') {
      mensagem = error.toString() + '\n' + JSON.stringify(error);
    } else {
      mensagem = 'exceção interna no processamento da requisição';
    }
    this.toastr.error(
      'A requisição falhou devido ao seguinte motivo: ' + mensagem,
      'Atenção!',
      {
        toastClass: 'toast ngx-toastr',
        timeOut: 24000,
        progressBar: true,
        closeButton: true
      }
    );
    this.desbloqueia();
    return throwError(mensagem);
  }

  errorHandlerx(res: HttpErrorResponse) {
    console.error(`notifica erro`);
    console.error(res);
    let mensagem = '';
    switch (res.status) {
      case 400: {
        mensagem += '\n * Erro 400, requisição inválida';
        break;
      }
      case 403: {
        mensagem += '\n * Erro 403, não permitido';
        break;
      }
      case 404: {
        mensagem += '\n * Erro 404, não encontrado';
        break;
      }
    }
    if (res.message)
      mensagem += '\n' + res.message;
    console.error(mensagem);
  }

  getStorageData(section: string, key: string): any {
    return JSON.parse(localStorage.getItem(`${section}.${key}`));
  }

  setStorageData(section: string, key: string, data: any) {
    if (data) {
      localStorage.setItem(`${section}.${key}`, JSON.stringify(data));
      return;
    }
    localStorage.removeItem(`${section}.${key}`);
  }

  private logx(s: string) {
    if (!this.logAll) {
      return;
    }
    console.log(s);
  }

  erro(mensagem: string = '') {
    throw new Error(`erro: ${mensagem}`);
  }

  operacaoNaoPermitida(mensagem: string = '') {
    throw new Error(`operação não permitida: ${mensagem}`);
  }

  getControlPath(c: AbstractControl, path: string): string | null {
    const getControlName = (c: AbstractControl): string | null => {
      if (!c.parent)
        return null;
      const formGroup = c.parent.controls;
      return Object.keys(formGroup).find(name => c === formGroup[name]) || null;
    }
    path = getControlName(c) + path;
    if (c.parent && getControlName(c.parent)) {
      path = "." + path;
      return this.getControlPath(c.parent, path);
    }
    return path;
  }

  valida(group: FormGroup | FormArray): boolean {
    const erros: string[] = [];

    const validaRecursivamente = (
      group: FormGroup | FormArray,
      inArray: boolean,
      index: number,
      erros: string[]
    ) => {
      Object.keys(group.controls).forEach((key: string, arrayIndex: number) => {
        const abstractControl = group.controls[key];

        if (abstractControl instanceof FormGroup || abstractControl instanceof FormArray) {
          const controlErrors: ValidationErrors | null = abstractControl.errors;
          if (controlErrors) {
            Object.keys(controlErrors).forEach(keyError => {
              let mensagem = '';
              if (keyError === 'message') {
                mensagem = `O formulário está com um valor inválido. Mensagem de validação: ${controlErrors[keyError]}.`;
              } else {
                mensagem = `Campo: ${key}, erro de validação: ${keyError}`;
              }
              erros.push(mensagem);
            });
          }

          const childIsArray = Number.isFinite(+key); // <= evita shadow e detecta índices numéricos
          validaRecursivamente(abstractControl, childIsArray, arrayIndex, erros);
          return;
        }
        if (abstractControl instanceof FormControl) {
          const controlErrors: ValidationErrors | null = abstractControl.errors;
          if (!controlErrors) return;
          let displayFieldName = '';
          const element = document.getElementById(this.getControlPath(abstractControl, ''));
          if (element instanceof HTMLInputElement) {
            if (element.labels?.length) displayFieldName = element.labels[0].textContent ?? '';
          }
          if (!displayFieldName && element?.id) {
            const labels = Array.from(document.querySelectorAll(`label[for="${element.id}"]`));
            if (labels?.length) displayFieldName = labels[0].textContent ?? '';
          }
          if (!displayFieldName) displayFieldName = key;
          Object.keys(controlErrors).forEach(keyError => {
            const completeError = controlErrors[keyError];
            let mensagem = '';
            if (keyError === 'required') {
              mensagem = `Campo "${displayFieldName}" não informado`;
            } else if (keyError === 'minlength') {
              const min = controlErrors.minlength.requiredLength;
              mensagem = `O campo "${displayFieldName}" deve ter pelo menos ${min} caracteres`;
            } else if (keyError === 'maxlength') {
              const max = controlErrors.maxlength.requiredLength;
              mensagem = `O campo "${displayFieldName}" pode ter no máximo ${max} caracteres`;
            } else if (keyError === 'min') {
              mensagem = `O conteúdo do campo "${displayFieldName}" é inferior ao mínimo permitido: informado ${completeError.actual}, mínimo ${completeError.min}`;
            } else if (keyError === 'max') {
              mensagem = `O conteúdo do campo "${displayFieldName}" é superior ao máximo permitido: informado ${completeError.actual}, máximo ${completeError.max}`;
            } else if (keyError === 'sintetica') {
              mensagem = `O campo "${displayFieldName}" permite apenas registros analíticos`;
            } else if (keyError === 'message') {
              mensagem = `O campo "${displayFieldName}" tem conteúdo inválido. Mensagem: ${controlErrors[keyError]}.`;
            } else {
              mensagem = `Campo: ${displayFieldName}, erro de validação: ${keyError}`;
            }
            if (inArray) {
              mensagem = `Índice ${index + 1}: ${mensagem}`;
            }
            erros.push(mensagem);
          });
        }
      });
    };

    validaRecursivamente(group, false, 0, erros);
    if (erros.length === 0) return true;
    erros.slice().reverse().forEach((erro, indice) => {
      const timeOut = Math.min((4 + indice) * 6000, 120000);
      const base = {
        toastClass: 'toast ngx-toastr',
        timeOut,
        extendedTimeOut: 30000,
        progressBar: true,
        closeButton: true,
      } as const;
      if (erro.endsWith('não informado')) {
        this.toastr.error(erro, 'Informação incompleta', base);
      } else {
        this.toastr.error(erro, 'Informação inválida', base);
      }
    });
    return false;
  }

  bloqueia() {
    // this.spinnerService.show(undefined, {
    //   type: 'ball-atom',
    //   color: '#fff',
    //   size: 'medium',
    //   fullScreen: true,
    //   showSpinner: true,
    // });
  }

  desbloqueia() {
    // this.spinnerService.hide();
  }

}
