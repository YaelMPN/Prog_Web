/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/views/MovimientosView.jsx
 * Framework: React + TypeScript + Bootstrap 5 (Grid y Formularios)
 * Rol Arquitectónico: Pantalla 2 (Registro de Movimientos) con formulario
 * reactivo para las 8 categorías de ingreso y 8 de egreso, mensaje emergente
 * con botón "Aceptar" al registrar notificaciones y lista lateral en vivo.
 * ============================================================================
 */

import React, { useState } from 'react';
import FrameworkBadge from '../components/FrameworkBadge';

const CATEGORIAS_INGRESO = [
    'Sueldo',
    'Inversión',
    'Ventas / Negocio',
    'Honorarios / Freelance',
    'Bonos y Aguinaldo',
    'Beca / Apoyo',
    'Reembolsos',
    'Otros (Ingresos)'
];

const CATEGORIAS_EGRESO = [
    'Alimentos',
    'Transporte',
    'Servicios',
    'Vivienda / Renta',
    'Salud y Farmacia',
    'Educación',
    'Ocio',
    'Otros (Gastos)'
];

export default function MovimientosView({
    balance,
    transactions,
    onAddTransaction,
    onNavigate,
    formatMoney
}) {
    const todayStr = new Date().toISOString().split('T')[0];

    const [tipo, setTipo] = useState('Ingreso');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState(CATEGORIAS_INGRESO[0]);
    const [fecha, setFecha] = useState(todayStr);
    const [descripcion, setDescripcion] = useState('');
    const [savedDetail, setSavedDetail] = useState('');
    const [modalInfo, setModalInfo] = useState({
        activo: false,
        esExito: false,
        titulo: 'Aviso',
        mensaje: ''
    });

    const opcionesCategoria = tipo === 'Ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;

    const handleSelectTipo = (nuevoTipo) => {
        setTipo(nuevoTipo);
        setCategoria(nuevoTipo === 'Ingreso' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0]);
    };

    const handleReset = () => {
        setTipo('Ingreso');
        setCategoria(CATEGORIAS_INGRESO[0]);
        setMonto('');
        setFecha(todayStr);
        setDescripcion('');
        setSavedDetail('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSavedDetail('');

        const numericMonto = parseFloat(monto || '0');
        if (isNaN(numericMonto) || numericMonto <= 0) {
            setModalInfo({
                activo: true,
                esExito: false,
                titulo: 'Monto inválido',
                mensaje: 'El monto debe ser una cantidad mayor a $0.00.'
            });
            return;
        }

        if (!categoria) {
            setModalInfo({
                activo: true,
                esExito: false,
                titulo: 'Categoría requerida',
                mensaje: 'Selecciona una categoría de la lista.'
            });
            return;
        }

        if (!fecha) {
            setModalInfo({
                activo: true,
                esExito: false,
                titulo: 'Fecha requerida',
                mensaje: 'Selecciona la fecha del movimiento.'
            });
            return;
        }

        if (descripcion.trim().length < 2) {
            setModalInfo({
                activo: true,
                esExito: false,
                titulo: 'Descripción requerida',
                mensaje: 'Ingresa una descripción para este movimiento.'
            });
            return;
        }

        const result = await onAddTransaction({
            tipo,
            monto: numericMonto,
            categoria,
            fecha,
            descripcion: descripcion.trim()
        });

        if (result && !result.ok) {
            setModalInfo({
                activo: true,
                esExito: false,
                titulo: result.titulo || 'Aviso',
                mensaje: result.message || 'No fue posible registrar el movimiento.'
            });
            return;
        }

        const txGuardada = result?.movimiento || {
            tipo,
            monto: numericMonto,
            categoria
        };

        const signo = txGuardada.tipo === 'Ingreso' ? '+' : '-';
        const detalleTexto = `${txGuardada.tipo} de ${formatMoney(txGuardada.monto)} en ${txGuardada.categoria}`;
        setSavedDetail(detalleTexto);
        setMonto('');
        setDescripcion('');

        // Mensaje emergente con botón Aceptar para notificar el movimiento registrado
        setModalInfo({
            activo: true,
            esExito: true,
            titulo: '¡Movimiento Registrado!',
            mensaje: `Notificación registrada: ${txGuardada.tipo} (${txGuardada.categoria}) por ${signo}${formatMoney(
                txGuardada.monto
            )}. Se ha actualizado tu saldo y tu bandeja de notificaciones.`
        });
    };

    const recent = (transactions || []).slice(0, 6);

    return (
        <main className="container py-4">
            {/* Encabezado */}
            <section className="card-finanzas p-4 mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                        <h1 className="h3 fw-bold text-[#3B5266] mb-1">Registro de Movimientos</h1>
                        <p className="text-sm text-slate-600 mb-0">
                            Captura tus ingresos y gastos seleccionando el monto, la categoría y la fecha.
                        </p>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary text-sm fw-semibold"
                            onClick={() => onNavigate('dashboard')}
                        >
                            ← Dashboard
                        </button>
                        <button
                            type="button"
                            className="btn-inst text-sm"
                            onClick={() => onNavigate('reportes')}
                        >
                            Ver Reportes →
                        </button>
                    </div>
                </div>
            </section>

            <div className="row g-4 align-items-start">
                {/* Columna Izquierda: Formulario */}
                <div className="col-12 col-lg-7">
                    <section className="card-finanzas">
                        <div className="card-header-inst">
                            <span>Nuevo Movimiento</span>
                        </div>

                        <div className="p-4">
                            <div
                                id="tx-success-banner"
                                className={`confirmation-banner-finanzas mb-3 ${
                                    savedDetail ? 'show' : ''
                                }`}
                                role="status"
                            >
                                <div>
                                    <strong>¡Movimiento registrado correctamente!</strong>
                                    <span className="d-block text-xs fw-normal mt-0.5" data-tx-saved-detail>
                                        {savedDetail}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-success fw-semibold text-nowrap"
                                    onClick={() => onNavigate('reportes')}
                                >
                                    Ver Historial →
                                </button>
                            </div>

                            <form id="movimientos-form" onSubmit={handleSubmit} noValidate>
                                {/* Tipo de Movimiento */}
                                <div className="mb-3">
                                    <label className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1">
                                        Tipo de Movimiento *
                                    </label>
                                    <input type="hidden" id="tx-tipo" name="tipo" value={tipo} />
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            id="btn-tipo-ingreso"
                                            className={
                                                tipo === 'Ingreso'
                                                    ? 'btn btn-royal flex-fill fw-bold'
                                                    : 'btn btn-outline-secondary flex-fill fw-semibold'
                                            }
                                            onClick={() => handleSelectTipo('Ingreso')}
                                        >
                                            ▲ Ingreso
                                        </button>
                                        <button
                                            type="button"
                                            id="btn-tipo-egreso"
                                            className={
                                                tipo === 'Egreso'
                                                    ? 'btn btn-royal flex-fill fw-bold'
                                                    : 'btn btn-outline-secondary flex-fill fw-semibold'
                                            }
                                            onClick={() => handleSelectTipo('Egreso')}
                                        >
                                            ▼ Egreso
                                        </button>
                                    </div>
                                </div>

                                {/* Monto y Categoría (8 de Ingreso y 8 de Egreso incluyendo Otros) */}
                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-sm-6">
                                        <label
                                            htmlFor="tx-monto"
                                            className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                        >
                                            Monto ($) *
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-[#F4F6F8] border-[#CFD8DC] fw-bold text-[#3B5266]">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                id="tx-monto"
                                                name="monto"
                                                step="0.01"
                                                min="0.01"
                                                className="form-control form-control-finanzas"
                                                placeholder="0.00"
                                                value={monto}
                                                onChange={(e) => setMonto(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-12 col-sm-6">
                                        <label
                                            htmlFor="tx-categoria"
                                            className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                        >
                                            Categoría *
                                        </label>
                                        <select
                                            id="tx-categoria"
                                            name="categoria"
                                            className="form-select form-select-finanzas"
                                            value={categoria}
                                            onChange={(e) => setCategoria(e.target.value)}
                                            required
                                        >
                                            {opcionesCategoria.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Fecha */}
                                <div className="mb-3">
                                    <label
                                        htmlFor="tx-fecha"
                                        className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                    >
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        id="tx-fecha"
                                        name="fecha"
                                        className="form-control form-control-finanzas"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Descripción */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="tx-descripcion"
                                        className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                    >
                                        Descripción *
                                    </label>
                                    <textarea
                                        id="tx-descripcion"
                                        name="descripcion"
                                        rows="2"
                                        className="form-control form-control-finanzas"
                                        placeholder="Concepto o detalle del movimiento..."
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="d-flex flex-wrap justify-content-end gap-2 pt-2 border-top border-[#CFD8DC]">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary fw-semibold"
                                        onClick={handleReset}
                                    >
                                        Limpiar
                                    </button>
                                    <button type="submit" className="btn-royal">
                                        Guardar Movimiento
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>

                {/* Columna Derecha: Saldo Actual y Movimientos Recientes */}
                <div className="col-12 col-lg-5">
                    <section className="card-finanzas mb-3 p-4">
                        <div className="text-xs fw-bold uppercase text-slate-500 mb-1">
                            SALDO DISPONIBLE
                        </div>
                        <div className="h3 fw-bold text-[#3B5266] mb-3" id="movimientos-live-balance">
                            {formatMoney(balance.saldoActual)}
                        </div>
                        <div className="row g-2 text-xs">
                            <div className="col-6">
                                <div className="p-2.5 rounded bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                                    <span className="d-block">Total Ingresos:</span>
                                    <strong className="text-sm" id="movimientos-live-ingresos">
                                        {formatMoney(balance.totalIngresos)}
                                    </strong>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-2.5 rounded bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]">
                                    <span className="d-block">Total Egresos:</span>
                                    <strong className="text-sm" id="movimientos-live-egresos">
                                        {formatMoney(balance.totalEgresos)}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="card-finanzas">
                        <div className="card-header-inst d-flex justify-content-between align-items-center">
                            <span>Movimientos Recientes</span>
                            <a
                                href="#reportes"
                                className="text-xs text-[#1D4ED8] text-decoration-none fw-bold"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onNavigate('reportes');
                                }}
                            >
                                Ver todos →
                            </a>
                        </div>
                        <div className="p-3 d-flex flex-column gap-2" id="movimientos-session-list">
                            {recent.length === 0 ? (
                                <div className="text-center py-4 text-slate-500 text-sm">
                                    Sin movimientos registrados todavía.
                                </div>
                            ) : (
                                recent.map((tx) => {
                                    const esIngreso = tx.tipo === 'Ingreso';
                                    return (
                                        <div
                                            key={tx.id}
                                            className="p-3 rounded border border-[#CFD8DC] bg-white d-flex align-items-center justify-content-between gap-2"
                                        >
                                            <div className="min-w-0">
                                                <div className="d-flex flex-wrap align-items-center gap-1.5 mb-1">
                                                    <span
                                                        className={
                                                            esIngreso ? 'badge-income' : 'badge-expense'
                                                        }
                                                    >
                                                        {tx.tipo}
                                                    </span>
                                                    <span className="badge-aqua">{tx.categoria}</span>
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        {tx.fecha}
                                                    </span>
                                                </div>
                                                <p className="mb-0 text-sm font-medium text-[#2D3748] text-truncate">
                                                    {tx.descripcion}
                                                </p>
                                            </div>
                                            <div
                                                className={`text-end fw-bold text-nowrap ${
                                                    esIngreso ? 'text-success' : 'text-danger'
                                                }`}
                                            >
                                                {esIngreso ? '+' : '-'}
                                                {formatMoney(tx.monto)}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Ventana Emergente / Modal Reactivo (Confirmación de Notificación y Validaciones) */}
            <div
                id="modalEmergente"
                className={`modal-overlay ${modalInfo.activo ? 'activo' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalTituloTexto"
            >
                <div className="modal-card">
                    {modalInfo.esExito ? (
                        <svg className="icono-exito-modal" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    ) : (
                        <svg className="icono-prevencion" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                        </svg>
                    )}
                    <h2 id="modalTituloTexto" className="modal-titulo">
                        {modalInfo.titulo}
                    </h2>
                    <p id="modalMensajeTexto" className="modal-mensaje">
                        {modalInfo.mensaje}
                    </p>
                    <button
                        type="button"
                        id="btnCerrarModal"
                        className="btn-modal"
                        onClick={() => setModalInfo({ ...modalInfo, activo: false })}
                    >
                        Aceptar
                    </button>
                </div>
            </div>

            <FrameworkBadge />
        </main>
    );
}
