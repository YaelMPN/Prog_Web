import { useEffect, useMemo, useState } from 'react';
import Loader from '../components/Loader';
import { obtenerTramites, verificarReporte } from '../api';
import type { TramiteResumen } from '../types';

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function HistorialView() {
  const [tramites, setTramites] = useState<TramiteResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [generando, setGenerando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    obtenerTramites()
      .then(setTramites)
      .catch(() => setError('No fue posible obtener el historial de trámites.'))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return tramites;
    return tramites.filter(t =>
      t.folio.toLowerCase().includes(q) ||
      t.solicitante.toLowerCase().includes(q) ||
      t.curp.toLowerCase().includes(q));
  }, [tramites, busqueda]);

  const descargar = async (folio: string) => {
    setMensaje('');
    setError('');
    setGenerando(folio);
    try {
      await Promise.all([verificarReporte(folio), new Promise(r => setTimeout(r, 1500))]);
      setMensaje(`Descarga finalizada con éxito. Se ha generado el reporte del trámite ${folio}.`);
    } catch {
      setError(`No fue posible generar el reporte del trámite ${folio}.`);
    } finally {
      setGenerando(null);
    }
  };

  return (
    <section>
      <h2 className="page-title">Historial de Folios</h2>

      {mensaje && (
        <div className="alert alert-success-custom d-flex justify-content-between align-items-center" role="alert">
          <span><strong className="me-2">✔</strong>{mensaje}</span>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setMensaje('')} />
        </div>
      )}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {generando && (
        <div className="mb-3"><Loader texto={`Generando reporte del trámite ${generando}…`} /></div>
      )}

      <div className="panel p-3">
        <input
          type="search"
          className="form-control mb-3"
          placeholder="Buscar por folio (TR-00001), nombre o CURP"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 tabla-tramites">
            <thead>
              <tr>
                <th>Folio</th><th>Fecha</th><th>Solicitante</th><th>CURP</th>
                <th className="text-end">Ingreso Mensual</th><th>Documentos</th><th />
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr><td colSpan={7} className="text-center py-4">Cargando trámites…</td></tr>
              )}
              {!cargando && filtrados.length === 0 && (
                <tr><td colSpan={7} className="text-center py-4 text-secondary-custom">
                  No se encontraron trámites.
                </td></tr>
              )}
              {filtrados.map(t => (
                <tr key={t.id}>
                  <td><span className="folio-chip">{t.folio}</span></td>
                  <td className="text-nowrap">{new Date(t.fechaRegistro).toLocaleString('es-MX')}</td>
                  <td>{t.solicitante}</td>
                  <td className="font-monospace">{t.curp}</td>
                  <td className="text-end">{moneda.format(t.ingresoMensual)}</td>
                  <td className="text-nowrap">
                    {t.pdfCargado && <span className="badge badge-ok me-1">PDF Cargado</span>}
                    {t.txtCargado && <span className="badge badge-ok">TXT Cargado</span>}
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-orange text-nowrap"
                      disabled={generando !== null}
                      onClick={() => descargar(t.folio)}
                    >
                      {generando === t.folio ? 'Procesando…' : 'Descargar Reporte'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
