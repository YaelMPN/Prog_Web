/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/views/DashboardView.jsx
 * Framework: React + TypeScript + Bootstrap 5 (Grid y Tablas)
 * Rol Arquitectónico: Pantalla 1 (Dashboard / Calculadora Financiera) que
 * presenta el saldo disponible, métricas principales, barra de sincronización
 * y resumen de movimientos recientes consumidos desde ASP.NET Core (.NET).
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import FrameworkBadge from '../components/FrameworkBadge';

export default function DashboardView({
    balance,
    transactions,
    desgloseCategorias,
    onRefresh,
    onUpdateSaldoBase,
    onNavigate,
    formatMoney
}) {
    const [syncing, setSyncing] = useState(true);
    const [editandoSaldo, setEditandoSaldo] = useState(false);
    const [nuevoSaldoInput, setNuevoSaldoInput] = useState(String(balance.saldoBase || 0));

    useEffect(() => {
        setNuevoSaldoInput(String(balance.saldoBase || 0));
    }, [balance.saldoBase]);

    useEffect(() => {
        setSyncing(true);
        const timer = setTimeout(() => {
            setSyncing(false);
        }, 380);
        return () => clearTimeout(timer);
    }, []);

    const handleRefreshMetrics = async () => {
        setSyncing(true);
        if (onRefresh) {
            await onRefresh();
        }
        setTimeout(() => {
            setSyncing(false);
        }, 420);
    };

    const handleGuardarSaldoBase = async (e) => {
        e.preventDefault();
        const valor = parseFloat(nuevoSaldoInput);
        if (!isNaN(valor) && valor >= 0 && onUpdateSaldoBase) {
            await onUpdateSaldoBase(valor);
            setEditandoSaldo(false);
        }
    };

    const conActividad = (desgloseCategorias || []).filter((c) => c.cantidad > 0);
    const listaMostrar =
        conActividad.length > 0
            ? conActividad
            : (desgloseCategorias || []).slice(0, 6);

    const recents = (transactions || []).slice(0, 5);

    return (
        <main className="container py-4">
            {/* Encabezado y Acciones */}
            <section className="card-finanzas p-4 mb-4">
                <div className="row align-items-center g-3">
                    <div className="col-12 col-lg-7">
                        <h1 className="h3 fw-bold text-[#3B5266] mb-1">
                            Panel de Control Financiero
                        </h1>
                        <p className="text-sm text-slate-600 mb-0">
                            Calculadora financiera interactiva. Aquí tienes el resumen general en tiempo real de tus ingresos, gastos y flujo disponible.
                        </p>
                    </div>
                    <div className="col-12 col-lg-5 d-flex flex-wrap justify-content-lg-end gap-2">
                        <button
                            type="button"
                            id="btn-refresh-metrics"
                            className="btn-inst text-sm"
                            onClick={handleRefreshMetrics}
                        >
                            Refrescar Métricas
                        </button>
                        <button
                            type="button"
                            className="btn-royal text-sm"
                            onClick={() => onNavigate('movimientos')}
                        >
                            + Registrar Movimiento
                        </button>
                    </div>
                </div>
            </section>

            {/* Barra de Carga Sencilla y Limpia */}
            <section
                id="tech-loader"
                className={`tech-loader-wrapper mb-4 ${syncing ? 'active' : ''}`}
                aria-live="polite"
            >
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-xs fw-bold text-[#3B5266]">
                        Actualizando métricas financieras...
                    </span>
                    <span className="badge-aqua">Sincronizando</span>
                </div>
                <div className="simple-loader-track">
                    <div className="simple-loader-bar"></div>
                </div>
            </section>

            {/* Tarjetas de Indicadores Principales */}
            <div
                id="dashboard-metrics-content"
                className="transition-opacity duration-200"
                style={{
                    opacity: syncing ? 0.4 : 1,
                    pointerEvents: syncing ? 'none' : 'auto'
                }}
            >
                <div className="row g-3 mb-4">
                    {/* Saldo Actual */}
                    <div className="col-12 col-md-4">
                        <div
                            className="card-finanzas p-4 h-100 border-top border-4"
                            style={{ borderTopColor: '#3B5266' }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <span className="text-xs fw-bold uppercase tracking-wider text-slate-500">
                                    SALDO ACTUAL DISPONIBLE
                                </span>
                                <span className="badge-aqua">Activo</span>
                            </div>
                            <div className="h2 fw-bold text-[#3B5266] mb-2" id="dash-saldo-actual">
                                {formatMoney(balance.saldoActual)}
                            </div>

                            {editandoSaldo ? (
                                <form onSubmit={handleGuardarSaldoBase} className="pt-2 border-top border-[#CFD8DC]">
                                    <label className="text-xs fw-bold text-[#3B5266] d-block mb-1">
                                        Definir Saldo Inicial ($):
                                    </label>
                                    <div className="d-flex gap-1">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="form-control form-control-sm form-control-finanzas py-1"
                                            value={nuevoSaldoInput}
                                            onChange={(e) => setNuevoSaldoInput(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-sm btn-royal py-1 px-2 text-xs">
                                            Guardar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary py-1 px-2 text-xs"
                                            onClick={() => setEditandoSaldo(false)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="d-flex justify-content-between align-items-center pt-2 border-top border-[#CFD8DC] text-xs text-slate-600">
                                    <span>
                                        Saldo Inicial:{' '}
                                        <strong id="dash-saldo-base">{formatMoney(balance.saldoBase)}</strong>{' '}
                                        <button
                                            type="button"
                                            className="btn btn-link btn-sm p-0 ms-1 text-xs text-[#1D4ED8] text-decoration-none fw-semibold"
                                            onClick={() => setEditandoSaldo(true)}
                                            title="Ajustar saldo inicial"
                                        >
                                            (Ajustar)
                                        </button>
                                    </span>
                                    <span>
                                        Balance Mes:{' '}
                                        <strong id="dash-balance-neto">
                                            {(balance.balanceNetoMes >= 0 ? '+' : '') +
                                                formatMoney(balance.balanceNetoMes)}
                                        </strong>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total de Ingresos */}
                    <div className="col-12 col-md-4">
                        <div
                            className="card-finanzas p-4 h-100 border-top border-4"
                            style={{ borderTopColor: '#15803D' }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <span className="text-xs fw-bold uppercase tracking-wider text-slate-500">
                                    TOTAL DE INGRESOS
                                </span>
                                <span className="badge-income" id="dash-count-ingresos">
                                    {balance.conteoIngresos} mov.
                                </span>
                            </div>
                            <div className="h2 fw-bold text-success mb-2" id="dash-total-ingresos">
                                {formatMoney(balance.totalIngresos)}
                            </div>
                            <div className="pt-2 border-top border-[#CFD8DC] text-xs text-slate-600">
                                Sueldo, Inversión, Ventas, Honorarios y más
                            </div>
                        </div>
                    </div>

                    {/* Total de Egresos */}
                    <div className="col-12 col-md-4">
                        <div
                            className="card-finanzas p-4 h-100 border-top border-4"
                            style={{ borderTopColor: '#B91C1C' }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <span className="text-xs fw-bold uppercase tracking-wider text-slate-500">
                                    TOTAL DE EGRESOS
                                </span>
                                <span className="badge-expense" id="dash-count-egresos">
                                    {balance.conteoEgresos} mov.
                                </span>
                            </div>
                            <div className="h2 fw-bold text-danger mb-2" id="dash-total-egresos">
                                {formatMoney(balance.totalEgresos)}
                            </div>
                            <div className="pt-2 border-top border-[#CFD8DC] text-xs text-slate-600">
                                Alimentos, Servicios, Transporte, Vivienda y más
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proporción y Categorías */}
                <div className="row g-4 mb-4">
                    <div className="col-12 col-lg-5">
                        <div className="card-finanzas h-100">
                            <div className="card-header-inst d-flex justify-content-between align-items-center">
                                <span>Proporción (Ingresos vs. Egresos)</span>
                                <a
                                    href="#reportes"
                                    className="text-xs text-[#1D4ED8] text-decoration-none fw-semibold"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate('reportes');
                                    }}
                                >
                                    Ver reporte →
                                </a>
                            </div>
                            <div className="p-4">
                                <div className="d-flex justify-content-between text-xs fw-bold mb-2">
                                    <span className="text-success" id="dash-pct-ingresos">
                                        {balance.porcentajeIngresos}% Ingresos
                                    </span>
                                    <span className="text-danger" id="dash-pct-egresos">
                                        {balance.porcentajeEgresos}% Egresos
                                    </span>
                                </div>
                                <div
                                    className="progress"
                                    style={{
                                        height: '16px',
                                        backgroundColor: '#E2E8F0',
                                        borderRadius: '9999px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div
                                        id="dash-bar-ingresos"
                                        className="progress-bar bg-success"
                                        role="progressbar"
                                        style={{ width: `${balance.porcentajeIngresos}%` }}
                                    ></div>
                                    <div
                                        id="dash-bar-egresos"
                                        className="progress-bar bg-danger"
                                        role="progressbar"
                                        style={{ width: `${balance.porcentajeEgresos}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-3 mb-3">
                                    Registra tus ingresos y gastos para visualizar la distribución de tu presupuesto.
                                </p>
                                <div className="d-grid gap-2">
                                    <button
                                        type="button"
                                        className="btn-royal text-sm"
                                        onClick={() => onNavigate('movimientos')}
                                    >
                                        Capturar Nuevo Movimiento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-7">
                        <div className="card-finanzas h-100">
                            <div className="card-header-inst d-flex justify-content-between align-items-center">
                                <span>Resumen por Categoría</span>
                                <a
                                    href="#analitica"
                                    className="text-xs text-[#1D4ED8] text-decoration-none fw-semibold"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate('analitica');
                                    }}
                                >
                                    Análisis completo →
                                </a>
                            </div>
                            <div className="p-4">
                                <div className="row g-2" id="dash-category-breakdown">
                                    {listaMostrar.map((item) => {
                                        const montoNeto =
                                            item.totalIngresos > 0 ? item.totalIngresos : item.totalEgresos;
                                        const esIngreso =
                                            item.totalIngresos >= item.totalEgresos && item.totalIngresos > 0;
                                        const badgeClass =
                                            item.cantidad === 0
                                                ? 'bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs fw-semibold'
                                                : esIngreso
                                                ? 'badge-income'
                                                : 'badge-expense';

                                        return (
                                            <div key={item.categoria} className="col-6 col-md-4">
                                                <div className="p-3 rounded border border-[#CFD8DC] bg-[#F8FAFC] flex flex-col justify-between h-100">
                                                    <div className="flex items-center justify-between mb-1 gap-1">
                                                        <span className="font-semibold text-xs text-[#3B5266] text-truncate">
                                                            {item.categoria}
                                                        </span>
                                                        <span className={`${badgeClass} text-nowrap`}>
                                                            {item.cantidad} mov.
                                                        </span>
                                                    </div>
                                                    <div className="text-base font-bold text-[#2D3748]">
                                                        {formatMoney(montoNeto)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla de Últimos Movimientos */}
                <section className="card-finanzas">
                    <div className="card-header-inst d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <span>Últimos Movimientos Registrados</span>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary fw-semibold"
                            onClick={() => onNavigate('reportes')}
                        >
                            Ver Historial Completo
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="text-xs uppercase text-slate-500">Fecha</th>
                                    <th className="text-xs uppercase text-slate-500">Tipo</th>
                                    <th className="text-xs uppercase text-slate-500">Categoría</th>
                                    <th className="text-xs uppercase text-slate-500">Descripción</th>
                                    <th className="text-xs uppercase text-slate-500 text-end">Monto</th>
                                </tr>
                            </thead>
                            <tbody id="dash-recent-table-body">
                                {recents.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">
                                            Aún no has registrado movimientos. Usa el botón "+ Registrar Movimiento" para comenzar.
                                        </td>
                                    </tr>
                                ) : (
                                    recents.map((tx) => {
                                        const esIngreso = tx.tipo === 'Ingreso';
                                        return (
                                            <tr key={tx.id}>
                                                <td className="text-nowrap font-mono text-xs text-slate-600">
                                                    {tx.fecha}
                                                </td>
                                                <td>
                                                    <span className={esIngreso ? 'badge-income' : 'badge-expense'}>
                                                        {esIngreso ? '▲ Ingreso' : '▼ Egreso'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge-aqua">{tx.categoria}</span>
                                                </td>
                                                <td className="text-sm text-[#2D3748]">{tx.descripcion}</td>
                                                <td
                                                    className={`text-end fw-bold ${
                                                        esIngreso ? 'text-success' : 'text-danger'
                                                    }`}
                                                >
                                                    {esIngreso ? '+' : '-'}
                                                    {formatMoney(tx.monto)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <FrameworkBadge />
        </main>
    );
}

