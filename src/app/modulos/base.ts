import { Corporacao } from './administrativo/corporacao/corporacao';
import { Empresa } from './administrativo/empresa/empresa';

export declare type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export class Base {

  static create<T extends Base>(this: new () => T, origem: DeepPartial<T>): T {
    const destino = new this();
    if (origem)
      Object.assign(destino, origem);
    return destino;
  }

  id: string;
  edicao: string;

}

export class BaseCorporacao {

  static create<T extends Base>(this: new () => T, origem: DeepPartial<T>): T {
    const destino = new this();
    if (origem)
      Object.assign(destino, origem);
    return destino;
  }

  id: string;
  edicao: string;
  corporacao: Corporacao;

}

export class BaseEmpresa {

  static create<T extends Base>(this: new () => T, origem: DeepPartial<T>): T {
    const destino = new this();
    if (origem)
      Object.assign(destino, origem);
    return destino;
  }

  id: string;
  edicao: string;
  corporacao: Corporacao;
  empresa: Empresa;

}