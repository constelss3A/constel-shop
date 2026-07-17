export class Endereco {
  id: string;
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  pontoReferencia: string;
  latitude: number;
  longitude: number;
}

export function cepDigitos(cep: string): string {
  return (cep || '').replace(/\D/g, '');
}

// O hifen so entra a partir do sexto digito: antes disso ele reaparece sozinho quando o
// usuario apaga, e o cursor trava.
export function cepFormata(cep: string): string {
  const digitos = cepDigitos(cep).slice(0, 8);
  if (digitos.length <= 5) {
    return digitos;
  }
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

export function cepValido(cep: string): boolean {
  return cepDigitos(cep).length === 8;
}
