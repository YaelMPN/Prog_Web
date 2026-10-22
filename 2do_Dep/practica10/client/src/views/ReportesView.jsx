/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/views/ReportesView.jsx
 * Framework: React + TypeScript + Bootstrap 5 (Tablas y Grid Responsivo)
 * Rol Arquitectónico: Pantalla 3 (Historial de Movimientos y Reportes) con
 * filtros dinámicos por tipo, categoría, buscador de texto, eliminación vía
 * DELETE /api/finanzas/movimientos/{id} en ASP.NET Core (.NET) y mensaje
 * emergente de confirmación.
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
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

export default function ReportesView({
    balance,
    transactions,
    onDeleteTransaction,
    onNavigate,
    formatMoney
}) {
    const [filtroTipo, setFiltroTipo] = useState('TODOS');
    const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
    const [busqueda, setBusqueda] = useState('');
    const [modalInfo, setModalInfo] = useState({
        activo: false,
        titulo: '',
        mensaje: ''
    });

    const transaccionesFiltradas = useMemo(() => {
        let lista = [...(transactions || [])];

        if (filtroTipo !== 'TODOS') {
            lista = lista.filter((tx) => tx.tipo === filtroTipo);
        }

        if (filtroCategoria !== 'TODAS') {
            lista = lista.filter((tx) => tx.categoria === filtroCategoria);
        }

        if (busqueda.trim() !== '') {
            const q = busqueda.trim().toLowerCase();
            lista = lista.filter(
                (tx) =>
                    tx.descripcion.toLowerCase().includes(q) ||
                    tx.categoria.toLowerCase().includes(q) ||
                    tx.id.toLowerCase().includes(q)
            );
        }

        return lista;
    }, [transactions, filtroTipo, filtroCategoria, busqueda]);

    const metricasFiltradas = useMemo(() => {
        const ingresos = transaccionesFiltradas
            .filter((t) => t.tipo === 'Ingreso')
            .reduce((acc, item) => acc + Number(item.monto), 0);

        const egresos = transaccionesFiltradas
            .filter((t) => t.tipo === 'Egreso')
            .reduce((acc, item) => acc + Number(item.monto), 0);

        const neto = ingresos - egresos;
        const volumen = ingresos + egresos;
        const pctIngresos = volumen > 0 ? Math.round((ingresos / volumen) * 100) : 0;
        const pctEgresos = volumen > 0 ? 100 - pctIngresos : 0;

        return {
            totalIngresos: Number(ingresos.toFixed(2)),
            totalEgresos: Number(egresos.toFixed(2)),
            balanceNetoMes: Number(neto.toFixed(2)),
            porcentajeIngresos: pctIngresos,
            porcentajeEgresos: pctEgresos
        };
    }, [transaccionesFiltradas]);

    const handleClearFilters = () => {
        setFiltroTipo('TODOS');
        setFiltroCategoria('TODAS');
        setBusqueda('');
    };

    const handleEliminar = async (tx) => {
        await onDeleteTransaction(tx.id);
        setModalInfo({
            activo: true,
            titulo: 'Movimiento Eliminado',
            mensaje: `Notificación registrada: Se eliminó el movimiento de "${tx.categoria}" por ${formatMoney(
                tx.monto
            )}.`
        });
    };

    return (
        <main className="container py-4">
            {/* Encabezado */}
            <section className="card-finanzas p-4 mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                        <h1 className="h3 fw-bold text-[#3B5266] mb-1">
                            Historial de Movimientos y Reportes
                        </h1>
                        <p className="text-sm text-slate-600 mb-0">
                            Consulta tus movimientos registrados, filtra por tipo o categoría y revisa tu balance comparativo.
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn-royal text-sm"
                            onClick={() => onNavigate('movimientos')}
                        >
                            + Nuevo Movimiento
                        </button>
                    </div>
                </div>
            </section>

            {/* Balance Comparativo Simple (Ingresos vs. Gastos) */}
            <section className="card-finanzas p-4 mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                    <h2 className="h6 fw-bold text-[#3B5266] mb-0">
                        Balance Comparativo (Ingresos vs. Gastos)
                    </h2>
                    <span className="badge-aqua" id="rep-conteo-filtrado">
                        {transaccionesFiltradas.length} movimientos
                    </span>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-6 col-md-3">
                        <div className="p-3 rounded border border-[#CFD8DC] bg-[#F4F6F8] h-100">
                            <span className="text-xs text-slate-500 d-block">Ingresos</span>
                            <strong className="h5 fw-bold text-success mb-0" id="rep-total-ingresos">
                                {formatMoney(metricasFiltradas.totalIngresos)}
                            </strong>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="p-3 rounded border border-[#CFD8DC] bg-[#F4F6F8] h-100">
                            <span className="text-xs text-slate-500 d-block">Gastos / Egresos</span>
                            <strong className="h5 fw-bold text-danger mb-0" id="rep-total-egresos">
                                {formatMoney(metricasFiltradas.totalEgresos)}
                            </strong>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="p-3 rounded border border-[#CFD8DC] bg-[#F4F6F8] h-100">
                            <span className="text-xs text-slate-500 d-block">Diferencia Neta</span>
                            <strong className="h5 fw-bold text-[#1D4ED8] mb-0" id="rep-balance-neto">
                                {(metricasFiltradas.balanceNetoMes >= 0 ? '+' : '') +
                                    formatMoney(metricasFiltradas.balanceNetoMes)}
                            </strong>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="p-3 rounded border border-[#CFD8DC] bg-[#F4F6F8] h-100">
                            <span className="text-xs text-slate-500 d-block">Saldo Total</span>
                            <strong className="h5 fw-bold text-[#3B5266] mb-0" id="rep-saldo-final">
                                {formatMoney(balance.saldoActual)}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-between text-xs fw-bold mb-1">
                    <span className="text-success" id="comp-label-ingresos">
                        Ingresos ({metricasFiltradas.porcentajeIngresos}%)
                    </span>
                    <span className="text-danger" id="comp-label-egresos">
                        Gastos / Egresos ({metricasFiltradas.porcentajeEgresos}%)
                    </span>
                </div>
                <div
                    className="progress"
                    style={{
                        height: '14px',
                        backgroundColor: '#E2E8F0',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                    }}
                >
                    <div
                        id="comp-bar-ingresos"
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${metricasFiltradas.porcentajeIngresos}%` }}
                    ></div>
                    <div
                        id="comp-bar-egresos"
                        className="progress-bar bg-danger"
                        role="progressbar"
                        style={{ width: `${metricasFiltradas.porcentajeEgresos}%` }}
                    ></div>
                </div>
            </section>

            {/* Barra de Filtros Rápidos */}
            <section className="card-finanzas p-3 mb-4">
                <div className="row g-3 align-items-center">
                    <div className="col-12 col-lg-5">
                        <span className="text-xs fw-bold uppercase text-[#3B5266] d-block mb-1">
                            Filtrar por Tipo:
                        </span>
                        <div className="d-flex flex-wrap gap-2">
                            <button
                                type="button"
                                className={`btn btn-sm ${
                                    filtroTipo === 'TODOS'
                                        ? 'badge-aqua px-3 py-1.5'
                                        : 'btn-outline-secondary rounded-pill px-3 py-1'
                                }`}
                                data-filter-tipo="TODOS"
                                onClick={() => setFiltroTipo('TODOS')}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${
                                    filtroTipo === 'Ingreso'
                                        ? 'badge-aqua px-3 py-1.5'
                                        : 'btn-outline-secondary rounded-pill px-3 py-1'
                                }`}
                                data-filter-tipo="Ingreso"
                                onClick={() => setFiltroTipo('Ingreso')}
                            >
                                ▲ Ingresos
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${
                                    filtroTipo === 'Egreso'
                                        ? 'badge-aqua px-3 py-1.5'
                                        : 'btn-outline-secondary rounded-pill px-3 py-1'
                                }`}
                                data-filter-tipo="Egreso"
                                onClick={() => setFiltroTipo('Egreso')}
                            >
                                ▼ Gastos
                            </button>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                        <label
                            htmlFor="filter-categoria"
                            className="text-xs fw-bold uppercase text-[#3B5266] d-block mb-1"
                        >
                            Categoría:
                        </label>
                        <select
                            id="filter-categoria"
                            className="form-select form-select-sm form-select-finanzas"
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                        >
                            <option value="TODAS">Todas las Categorías</option>
                            <optgroup label="Ingresos">
                                {CATEGORIAS_INGRESO.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="Egresos / Gastos">
                                {CATEGORIAS_EGRESO.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-4">
                        <label
                            htmlFor="filter-busqueda"
                            className="text-xs fw-bold uppercase text-[#3B5266] d-block mb-1"
                        >
                            Buscar:
                        </label>
                        <div className="d-flex gap-2">
                            <input
                                type="search"
                                id="filter-busqueda"
                                className="form-control form-control-sm form-control-finanzas"
                                placeholder="Buscar descripción..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                            <button
                                type="button"
                                id="btn-clear-filters"
                                className="btn btn-sm btn-outline-secondary text-nowrap"
                                onClick={handleClearFilters}
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tabla Responsiva */}
            <section className="card-finanzas">
                <div className="card-header-inst">
                    <span>Listado de Movimientos</span>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="text-xs uppercase text-slate-500">ID</th>
                                <th className="text-xs uppercase text-slate-500">Fecha</th>
                                <th className="text-xs uppercase text-slate-500">Tipo</th>
                                <th className="text-xs uppercase text-slate-500">Categoría</th>
                                <th className="text-xs uppercase text-slate-500">Descripción</th>
                                <th className="text-xs uppercase text-slate-500 text-end">Monto</th>
                                <th className="text-xs uppercase text-slate-500 text-center">
                                    Eliminar
                                </th>
                            </tr>
                        </thead>
                        <tbody id="reportes-table-body">
                            {transaccionesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-slate-500">
                                        No hay movimientos registrados para mostrar.
                                    </td>
                                </tr>
                            ) : (
                                transaccionesFiltradas.map((tx) => {
                                    const esIngreso = tx.tipo === 'Ingreso';
                                    return (
                                        <tr key={tx.id}>
                                            <td className="font-mono text-xs text-slate-500">
                                                {tx.id}
                                            </td>
                                            <td className="text-nowrap font-mono text-xs">
                                                {tx.fecha}
                                            </td>
                                            <td>
                                                <span
                                                    className={
                                                        esIngreso ? 'badge-income' : 'badge-expense'
                                                    }
                                                >
                                                    {esIngreso ? '▲ Ingreso' : '▼ Egreso'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge-aqua">{tx.categoria}</span>
                                            </td>
                                            <td className="text-sm text-[#2D3748]">
                                                {tx.descripcion}
                                            </td>
                                            <td
                                                className={`text-end fw-bold text-nowrap ${
                                                    esIngreso ? 'text-success' : 'text-danger'
                                                }`}
                                            >
                                                {esIngreso ? '+' : '-'}
                                                {formatMoney(tx.monto)}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger py-0 px-2"
                                                    data-delete-tx={tx.id}
                                                    title="Eliminar movimiento"
                                                    onClick={() => handleEliminar(tx)}
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Ventana Emergente con botón Aceptar */}
            <div
                className={`modal-overlay ${modalInfo.activo ? 'activo' : ''}`}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-card">
                    <svg className="icono-prevencion" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                    <h2 className="modal-titulo">{modalInfo.titulo}</h2>
                    <p className="modal-mensaje">{modalInfo.mensaje}</p>
                    <button
                        type="button"
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
