export interface Genero { id: number; nombre: string }
export interface EstadoMx { id: number; nombreEstado: string; clave: string }
export interface Ocupacion { id: number; titulo: string }
export interface Catalogos { generos: Genero[]; estados: EstadoMx[]; ocupaciones: Ocupacion[] }

export interface TramiteResumen {
  id: number;
  folio: string;
  fechaRegistro: string;
  solicitante: string;
  curp: string;
  ingresoMensual: number;
  pdfCargado: boolean;
  txtCargado: boolean;
}

export interface TramiteCreado {
  folio: string;
  fechaRegistro: string;
  solicitante: string;
  curp: string;
  ingresoMensual: number;
  nombrePdf: string;
  nombreTxt: string;
}
