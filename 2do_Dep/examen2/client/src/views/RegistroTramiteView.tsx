import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import ModalFolio from '../components/ModalFolio';
import { obtenerCatalogos, registrarTramite } from '../api';
import type { Catalogos } from '../types';

interface Props { onIrHistorial: () => void }

const MAX_PDF = 10 * 1024 * 1024;
const MAX_TXT = 5 * 1024 * 1024;

const inicial = {
  nombre: '', primerApellido: '', segundoApellido: '', curp: '', correo: '', telefono: '',
  fechaNacimiento: '', generoId: '',
  calle: '', numeroExterior: '', numeroInterior: '', colonia: '', codigoPostal: '',
  municipioAlcaldia: '', estadoId: '',
  ocupacionId: '', ingresoMensual: '', dependientesEconomicos: '0', situacionVivienda: ''
};
type Form = typeof inicial;

interface ArchivoEstado { archivo: File | null; error: string }
const sinArchivo: ArchivoEstado = { archivo: null, error: '' };

function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validarArchivo(file: File, ext: string, max: number, etiqueta: string, mime: string): string {
  const nombre = file.name.toLowerCase();
  if (!nombre.endsWith(ext) || (file.type && file.type !== mime)) {
    return `El archivo debe ser un ${etiqueta} con extensión ${ext}.`;
  }
  if (file.size === 0) return 'El archivo está vacío.';
  if (file.size > max) return `El archivo supera el máximo permitido de ${formatearTamano(max)}.`;
  return '';
}

const CURP_RE = /^[A-Z]{4}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/i;

export default function RegistroTramiteView({ onIrHistorial }: Props) {
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [form, setForm] = useState<Form>(inicial);
  const [pdf, setPdf] = useState<ArchivoEstado>(sinArchivo);
  const [txt, setTxt] = useState<ArchivoEstado>(sinArchivo);
  const [abierto, setAbierto] = useState(1);
  const [intento, setIntento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [folio, setFolio] = useState<string | null>(null);
  const [claveArchivos, setClaveArchivos] = useState(0);

  useEffect(() => {
    obtenerCatalogos()
      .then(setCatalogos)
      .catch(() => setError('No fue posible cargar los catálogos. Verifique el servicio e intente nuevamente.'));
  }, []);

  const set = (campo: keyof Form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const valor = campo === 'curp' ? e.target.value.toUpperCase() : e.target.value;
      setForm(f => ({ ...f, [campo]: valor }));
    };

  const ok1 = form.nombre.trim() !== '' && form.primerApellido.trim() !== '' && CURP_RE.test(form.curp) &&
    /^\S+@\S+\.\S+$/.test(form.correo) && /^\d{10}$/.test(form.telefono) &&
    form.fechaNacimiento !== '' && form.generoId !== '';
  const ok2 = form.calle.trim() !== '' && form.numeroExterior.trim() !== '' && form.colonia.trim() !== '' &&
    /^\d{5}$/.test(form.codigoPostal) && form.municipioAlcaldia.trim() !== '' && form.estadoId !== '';
  const ok3 = form.ocupacionId !== '' && form.ingresoMensual !== '' && Number(form.ingresoMensual) >= 0 &&
    form.dependientesEconomicos !== '' && Number(form.dependientesEconomicos) >= 0 && form.situacionVivienda !== '';
  const ok4 = pdf.archivo !== null && !pdf.error && txt.archivo !== null && !txt.error;
  const oks = [ok1, ok2, ok3, ok4];
  const progreso = oks.filter(Boolean).length * 25;

  const elegirArchivo = (tipo: 'pdf' | 'txt') => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const setter = tipo === 'pdf' ? setPdf : setTxt;
    if (!file) { setter(sinArchivo); return; }
    const err = tipo === 'pdf'
      ? validarArchivo(file, '.pdf', MAX_PDF, 'PDF', 'application/pdf')
      : validarArchivo(file, '.txt', MAX_TXT, 'TXT', 'text/plain');
    setter({ archivo: err ? null : file, error: err });
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setIntento(true);
    setError('');
    const primerPendiente = oks.findIndex(v => !v);
    if (primerPendiente >= 0) {
      setAbierto(primerPendiente + 1);
      setError('Complete correctamente todos los pasos antes de registrar el trámite.');
      return;
    }
    const fd = new FormData();
    fd.append('Nombre', form.nombre);
    fd.append('PrimerApellido', form.primerApellido);
    fd.append('SegundoApellido', form.segundoApellido);
    fd.append('Curp', form.curp);
    fd.append('Correo', form.correo);
    fd.append('Telefono', form.telefono);
    fd.append('FechaNacimiento', form.fechaNacimiento);
    fd.append('GeneroId', form.generoId);
    fd.append('Calle', form.calle);
    fd.append('NumeroExterior', form.numeroExterior);
    fd.append('NumeroInterior', form.numeroInterior);
    fd.append('Colonia', form.colonia);
    fd.append('CodigoPostal', form.codigoPostal);
    fd.append('MunicipioAlcaldia', form.municipioAlcaldia);
    fd.append('EstadoId', form.estadoId);
    fd.append('OcupacionId', form.ocupacionId);
    fd.append('IngresoMensual', form.ingresoMensual);
    fd.append('DependientesEconomicos', form.dependientesEconomicos);
    fd.append('SituacionVivienda', form.situacionVivienda);
    fd.append('ArchivoPdf', pdf.archivo as File);
    fd.append('ArchivoTxt', txt.archivo as File);

    setEnviando(true);
    try {
      const res = await registrarTramite(fd);
      setFolio(res.folio);
      setForm(inicial);
      setPdf(sinArchivo);
      setTxt(sinArchivo);
      setClaveArchivos(k => k + 1);
      setIntento(false);
      setAbierto(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible registrar el trámite.');
    } finally {
      setEnviando(false);
    }
  };

  const invalido = (cond: boolean) => (intento && cond ? ' is-invalid' : '');

  const paso = (n: number, titulo: string, contenido: ReactNode, ultimo = false) => (
    <div className={`panel step-panel mb-3 ${abierto === n ? 'open' : ''}`}>
      <button type="button" className="step-header" onClick={() => setAbierto(abierto === n ? 0 : n)}
        aria-expanded={abierto === n}>
        <span className={`step-number ${oks[n - 1] ? 'done' : ''}`}>{oks[n - 1] ? '✔' : n}</span>
        <span className="step-title">{titulo}</span>
        <span className="step-caret">{abierto === n ? '▲' : '▼'}</span>
      </button>
      {abierto === n && (
        <div className="step-body">
          {contenido}
          {!ultimo && (
            <div className="text-end mt-3">
              <button type="button" className="btn btn-outline-dark" onClick={() => setAbierto(n + 1)}>
                Continuar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const campo = (etiqueta: string, control: ReactNode, col = 'col-md-4', ayuda?: string) => (
    <div className={col}>
      <label className="form-label">{etiqueta}</label>
      {control}
      {ayuda && <div className="invalid-feedback">{ayuda}</div>}
    </div>
  );

  const resultadoArchivo = (st: ArchivoEstado) => (
    <>
      {st.archivo && (
        <div className="file-ok mt-2" role="status">
          <span className="file-check">✔</span>
          <span className="text-truncate">{st.archivo.name}</span>
          <span className="file-size">{formatearTamano(st.archivo.size)}</span>
        </div>
      )}
      {st.error && <div className="file-error mt-2" role="alert">{st.error}</div>}
      {intento && !st.archivo && !st.error && (
        <div className="file-error mt-2">Este documento es obligatorio.</div>
      )}
    </>
  );

  return (
    <section>
      <h2 className="page-title">Registrar Trámite</h2>

      <div className="panel p-3 mb-3">
        <div className="d-flex justify-content-between mb-1">
          <strong>Avance del formulario</strong><span>{progreso}%</span>
        </div>
        <div className="progress" style={{ height: 10 }}>
          <div className="progress-bar progress-orange" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <form onSubmit={enviar} noValidate>
        {paso(1, 'Datos Biodemográficos', (
          <div className="row g-3">
            {campo('Nombre(s)', <input className={`form-control${invalido(!form.nombre.trim())}`} value={form.nombre} onChange={set('nombre')} maxLength={80} />)}
            {campo('Primer apellido', <input className={`form-control${invalido(!form.primerApellido.trim())}`} value={form.primerApellido} onChange={set('primerApellido')} maxLength={80} />)}
            {campo('Segundo apellido', <input className="form-control" value={form.segundoApellido} onChange={set('segundoApellido')} maxLength={80} />)}
            {campo('CURP', <input className={`form-control font-monospace${invalido(!CURP_RE.test(form.curp))}`} value={form.curp} onChange={set('curp')} maxLength={18} />, 'col-md-6', 'Ingrese una CURP válida de 18 caracteres.')}
            {campo('Correo electrónico', <input type="email" className={`form-control${invalido(!/^\S+@\S+\.\S+$/.test(form.correo))}`} value={form.correo} onChange={set('correo')} />, 'col-md-6', 'Ingrese un correo válido.')}
            {campo('Teléfono (10 dígitos)', <input inputMode="numeric" className={`form-control${invalido(!/^\d{10}$/.test(form.telefono))}`} value={form.telefono} onChange={set('telefono')} maxLength={10} />, 'col-md-4', 'Ingrese 10 dígitos.')}
            {campo('Fecha de nacimiento', <input type="date" className={`form-control${invalido(!form.fechaNacimiento)}`} value={form.fechaNacimiento} onChange={set('fechaNacimiento')} max={new Date().toISOString().slice(0, 10)} />)}
            {campo('Género', (
              <select className={`form-select${invalido(!form.generoId)}`} value={form.generoId} onChange={set('generoId')}>
                <option value="">Seleccione…</option>
                {catalogos?.generos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            ))}
          </div>
        ))}

        {paso(2, 'Datos Geográficos', (
          <div className="row g-3">
            {campo('Calle', <input className={`form-control${invalido(!form.calle.trim())}`} value={form.calle} onChange={set('calle')} maxLength={120} />, 'col-md-6')}
            {campo('No. Exterior', <input className={`form-control${invalido(!form.numeroExterior.trim())}`} value={form.numeroExterior} onChange={set('numeroExterior')} maxLength={20} />, 'col-md-3')}
            {campo('No. Interior', <input className="form-control" value={form.numeroInterior} onChange={set('numeroInterior')} maxLength={20} />, 'col-md-3')}
            {campo('Colonia', <input className={`form-control${invalido(!form.colonia.trim())}`} value={form.colonia} onChange={set('colonia')} maxLength={100} />)}
            {campo('C.P.', <input inputMode="numeric" className={`form-control${invalido(!/^\d{5}$/.test(form.codigoPostal))}`} value={form.codigoPostal} onChange={set('codigoPostal')} maxLength={5} />, 'col-md-2', 'Ingrese 5 dígitos.')}
            {campo('Municipio / Alcaldía', <input className={`form-control${invalido(!form.municipioAlcaldia.trim())}`} value={form.municipioAlcaldia} onChange={set('municipioAlcaldia')} maxLength={100} />, 'col-md-3')}
            {campo('Estado', (
              <select className={`form-select${invalido(!form.estadoId)}`} value={form.estadoId} onChange={set('estadoId')}>
                <option value="">Seleccione…</option>
                {catalogos?.estados.map(s => <option key={s.id} value={s.id}>{s.nombreEstado}</option>)}
              </select>
            ), 'col-md-3')}
          </div>
        ))}

        {paso(3, 'Datos Económicos', (
          <div className="row g-3">
            {campo('Ocupación', (
              <select className={`form-select${invalido(!form.ocupacionId)}`} value={form.ocupacionId} onChange={set('ocupacionId')}>
                <option value="">Seleccione…</option>
                {catalogos?.ocupaciones.map(o => <option key={o.id} value={o.id}>{o.titulo}</option>)}
              </select>
            ))}
            {campo('Ingreso mensual (MXN)', (
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input type="number" min={0} step="0.01" className={`form-control${invalido(form.ingresoMensual === '' || Number(form.ingresoMensual) < 0)}`} value={form.ingresoMensual} onChange={set('ingresoMensual')} />
              </div>
            ))}
            {campo('Dependientes económicos', <input type="number" min={0} max={50} className={`form-control${invalido(form.dependientesEconomicos === '' || Number(form.dependientesEconomicos) < 0)}`} value={form.dependientesEconomicos} onChange={set('dependientesEconomicos')} />)}
            {campo('Situación de vivienda', (
              <select className={`form-select${invalido(!form.situacionVivienda)}`} value={form.situacionVivienda} onChange={set('situacionVivienda')}>
                <option value="">Seleccione…</option>
                <option value="Propia">Propia</option>
                <option value="Rentada">Rentada</option>
                <option value="Familiar">Familiar</option>
              </select>
            ), 'col-md-6')}
          </div>
        ))}

        {paso(4, 'Documentación Obligatoria', (
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label">Documento PDF <small className="text-secondary-custom">(máx. 10 MB)</small></label>
              <input key={`pdf-${claveArchivos}`} type="file" accept=".pdf,application/pdf"
                className={`form-control${pdf.error ? ' is-invalid' : ''}`} onChange={elegirArchivo('pdf')} />
              {resultadoArchivo(pdf)}
            </div>
            <div className="col-md-6">
              <label className="form-label">Documento TXT <small className="text-secondary-custom">(máx. 5 MB)</small></label>
              <input key={`txt-${claveArchivos}`} type="file" accept=".txt,text/plain"
                className={`form-control${txt.error ? ' is-invalid' : ''}`} onChange={elegirArchivo('txt')} />
              {resultadoArchivo(txt)}
            </div>
          </div>
        ), true)}

        <div className="text-end mb-4">
          <button type="submit" className="btn btn-orange btn-lg px-4" disabled={enviando}>
            {enviando ? (<><span className="spinner-border spinner-border-sm me-2" />Registrando…</>) : 'Registrar Trámite'}
          </button>
        </div>
      </form>

      {folio && (
        <ModalFolio
          folio={folio}
          onCerrar={() => setFolio(null)}
          onIrHistorial={() => { setFolio(null); onIrHistorial(); }}
        />
      )}
    </section>
  );
}
