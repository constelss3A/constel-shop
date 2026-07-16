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

// So os digitos, sem truncar. Serve tanto para o que o cliente digita quanto para o CEP
// mascarado que o backend manda no endereco do estabelecimento ("70.747-030").
export function cepDigitos(cep: string): string {
  return (cep || '').replace(/\D/g, '');
}

// Mascara 00000-000 aplicada enquanto se digita. O hifen so aparece a partir do sexto
// digito, senao ele reaparece sozinho quando o usuario tenta apagar e o cursor trava.
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
