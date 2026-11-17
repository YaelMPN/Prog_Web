import type { Catalogos, TramiteCreado, TramiteResumen } from './types';

const BASE = import.meta.env.VITE_API_URL ?? '';

async function leerError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.error) return data.error as string;
    if (data?.errors) return Object.values(data.errors as Record<string, string[]>).flat().join(' ');
    if (data?.title) return data.title as string;
  } catch { /* sin cuerpo JSON */ }
  return `Error ${res.status}`;
}

export async function obtenerCatalogos(): Promise<Catalogos> {
  const res = await fetch(`${BASE}/api/catalogos`);
  if (!res.ok) throw new Error(await leerError(res));
  return res.json();
}

export async function obtenerTramites(): Promise<TramiteResumen[]> {
  const res = await fetch(`${BASE}/api/tramites`);
  if (!res.ok) throw new Error(await leerError(res));
  return res.json();
}

export async function registrarTramite(form: FormData): Promise<TramiteCreado> {
  const res = await fetch(`${BASE}/api/tramites`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await leerError(res));
  return res.json();
}

export async function verificarReporte(folio: string): Promise<void> {
  const res = await fetch(`${BASE}/api/tramites/${encodeURIComponent(folio)}/reporte-simulado`);
  if (!res.ok) throw new Error(await leerError(res));
}
