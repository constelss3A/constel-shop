import { CardapioItem } from "./cardapio";

export class Sacola {
  cliente: SacolaCliente;
  linhas: SacolaLinha[] = [];
  linhasPrincipais: SacolaLinha[] = [];
  quantidade: number = 0;
  total: number = 0.0;

  inicia() {
    this.linhas = [];
    this.linhasPrincipais = [];
    this.quantidade = 0;
    this.total = 0.0;
  }

  adiciona(item: CardapioItem, quantidade: number = 1) {
    const itemSacola = this.linhas.find((i) => i.item.id === item.id);
    if (itemSacola && item.montagemBloco == null) {
      itemSacola.quantidade += quantidade;
      itemSacola.total = itemSacola.quantidade * itemSacola.valor;
    } else {
      this.linhas.push({
        _id: new Date().getTime().toString(), /// UUID
        item,
        valor: item.valor,
        quantidade: quantidade,
        total: item.valor * quantidade,
      });
    }
    this.totalAtualiza();
  }

  remove(linha: SacolaLinha, quantidade = 0) {
    const _linha = this.linhas.find((x) => x._id === linha._id);
    if (_linha) {
      if (quantidade > 0 && _linha.quantidade > quantidade) {
        _linha.quantidade -= quantidade;
        _linha.total = _linha.quantidade * _linha.valor;
        if (_linha.item.montagemBloco != null) {
          var linhasMontagem = this.linhas.filter(
            (x) =>
              x.item.montagemBloco === _linha.item.montagemBloco &&
              x._id !== _linha._id,
          );
          linhasMontagem.forEach((linha) => {
            linha.quantidade -= quantidade;
            linha.total = linha.quantidade * linha.valor;
          });
        }
      } else {
        if (_linha.item.montagemBloco != null) {
          var linhasMontagem = this.linhas.filter(
            (x) =>
              x.item.montagemBloco === _linha.item.montagemBloco &&
              x._id !== _linha._id,
          );
          linhasMontagem.forEach((linha) => {
            this.linhas.splice(this.linhas.indexOf(linha), 1);
          });
        }
        this.linhas.splice(this.linhas.indexOf(_linha), 1);
      }
      this.totalAtualiza();
    }
  }

  linhaAtualizaQuantidade(linha: SacolaLinha, quantidade: number) {
    if (quantidade < 0) {
      return;
    }
    const _linha = this.linhas.find((x) => x._id === linha._id);
    if (!quantidade && _linha) {
      if (_linha.item.montagemBloco != null) {
        var linhasMontagem = this.linhas.filter(
          (x) =>
            x.item.montagemBloco === _linha.item.montagemBloco &&
            x._id !== _linha._id,
        );
        linhasMontagem.forEach((linha) => {
          this.linhas.splice(this.linhas.indexOf(linha), 1);
        });
      }
      this.linhas.splice(this.linhas.indexOf(_linha), 1);
      this.totalAtualiza();
      return;
    }
    if (_linha) {
      _linha.quantidade = quantidade;
      _linha.total = _linha.quantidade * _linha.valor;
      if (_linha.item.montagemBloco != null) {
        var linhasMontagem = this.linhas.filter(
          (x) =>
            x.item.montagemBloco === _linha.item.montagemBloco &&
            x._id !== _linha._id,
        );
        linhasMontagem.forEach((linha) => {
          linha.quantidade = quantidade;
          linha.total = linha.quantidade * linha.valor;
        });
      }
      this.totalAtualiza();
    }
  }

  identifica(cliente: SacolaCliente) {
    this.cliente = cliente;
  }

  totalAtualiza() {
    this.quantidade = 0;
    this.total = 0.0;
    this.linhas.forEach((item) => {
      if (item.item.montagemBloco == null || item.item.montagemTipo === 10) {
        this.quantidade += item.quantidade;
      }
      this.total += item.total;
    });
    this.linhasPrincipais = this.linhas.filter(
      (l) =>
        l.item.montagemTipo === 10 ||
        l.item.montagemTipo === null ||
        l.item.montagemTipo === undefined,
    );
  }

  getTotalLinha(linha: SacolaLinha): number {
    if (linha.item.montagemTipo === 10) {
      return this.linhas.reduce((total, l) => {
        if (l.item.montagemBloco === linha.item.montagemBloco) {
          return total + l.total;
        }
        return total;
      }, 0);
    } else {
      return linha.total;
    }
  }

  getLinhasSubItens(montagemBloco: string): SacolaLinha[] {
    return this.linhas.filter(
      (linha) =>
        linha.item.montagemBloco == montagemBloco &&
        linha.item.montagemTipo != 10,
    );
  }
}

export class SacolaCliente {
  identificador: string;
  nome: string;
  imagem: string;
  email: string;
}

export class SacolaLinha {
  _id: string;
  item: CardapioItem;
  valor: number;
  quantidade: number;
  total: number;
}
