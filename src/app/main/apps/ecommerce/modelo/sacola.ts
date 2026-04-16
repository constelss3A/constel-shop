import { CardapioItem } from './cardapio';

export class Sacola {
  cliente: SacolaCliente;
  linhas: SacolaLinha[] = [];
  quantidade: number = 0;
  total: number = 0.00;

  inicia() {
    this.linhas = [];
    this.quantidade = 0;
    this.total = 0.00;
  }

  adiciona(item: CardapioItem) {
    const itemSacola = this.linhas.find(i => i.item.id === item.id);
    if (itemSacola) {
      itemSacola.quantidade++;
      itemSacola.total = itemSacola.quantidade * itemSacola.valor;
    } else {
      this.linhas.push({
        _id: new Date().getTime().toString(), /// UUID
        item,
        valor: item.valor,
        quantidade: 1,
        total: item.valor,
      });
    }
    this.totalAtualiza();
  }

  remove(linha: SacolaLinha, quantidade = 0) {
    const _linha = this.linhas.find(x => x._id === linha._id);
    if (_linha) {
      if ((quantidade > 0) && (_linha.quantidade > quantidade)) {
        _linha.quantidade -= quantidade;
        _linha.total = _linha.quantidade * _linha.valor;
      } else {
        this.linhas.splice(this.linhas.indexOf(_linha), 1);
      }
      this.totalAtualiza();
    }
  }

  linhaAtualizaQuantidade(linha: SacolaLinha, quantidade: number) {
    if (quantidade < 0) {
      return;
    }
    const _linha = this.linhas.find(x => x._id === linha._id);
    if (!quantidade) {
      this.linhas.splice(this.linhas.indexOf(_linha), 1);
      this.totalAtualiza();
      return;
    }
    if (_linha) {
      _linha.quantidade = quantidade;
      _linha.total = _linha.quantidade * _linha.valor;
      this.totalAtualiza();
    }
  }

  identifica(cliente: SacolaCliente) {
    this.cliente = cliente;
  }

  totalAtualiza() {
    this.quantidade = 0;
    this.total = 0.00;
    this.linhas.forEach(item => {
      this.quantidade += item.quantidade;
      this.total += item.total;
    });
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