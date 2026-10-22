/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/views/AnaliticaView.jsx
 * Framework: React (useMemo) + Bootstrap 5 (Grid, Barras de Progreso y Tablas)
 * Rol Arquitectónico: Pantalla 5 (Análisis de Presupuesto) que expande la
 * barra proporcional y el desglose de las 16 categorías (8 de ingreso y 8 de
 * egreso) a pantalla completa con resumen financiero ejecutivo.
 * ============================================================================
 */

import React, { useMemo } from 'react';
import FrameworkBadge from '../components/FrameworkBadge';

export default function AnaliticaView({
    balance,
    desgloseCategorias = [],
    onNavigate,
    formatMoney
}) {
    const analisis = useMemo(() => {
        const totalIngresos = Number(balance.totalIngresos || 0);
        const totalEgresos = Number(balance.totalEgresos || 0);
        const saldoActual = Number(balance.saldoActual || 0);
        const balanceNetoMes = Number(balance.balanceNetoMes || 0);

        const tasaAhorro =
            totalIngresos > 0
                ? Math.max(0, Math.round(((totalIngresos - totalEgresos) / totalIngresos) * 100))
                : 0;

        const indiceConsumo =
            totalIngresos > 0 ? Math.min(100, Math.round((totalEgresos / totalIngresos) * 100)) : 0;

        const categoriasIngreso = desgloseCategorias
            .filter((c) => c.tipoSugerido === 'Ingreso')
            .map((c) => ({
                ...c,
                porcentajeRubro:
                    totalIngresos > 0 ? Math.round((c.totalIngresos / totalIngresos) * 100) : 0
            }))
            .sort((a, b) => b.totalIngresos - a.totalIngresos);

        const categoriasEgreso = desgloseCategorias
            .filter((c) => c.tipoSugerido === 'Egreso')
            .map((c) => ({
                ...c,
                porcentajeRubro:
                    totalEgresos > 0 ? Math.round((c.totalEgresos / totalEgresos) * 100) : 0,
                porcentajeSobreIngresos:
                    totalIngresos > 0 ? Math.round((c.totalEgresos / totalIngresos) * 100) : 0
            }))
            .sort((a, b) => b.totalEgresos - a.totalEgresos);

        return {
            totalIngresos,
            totalEgresos,
            saldoActual,
            balanceNetoMes,
            tasaAhorro,
            indiceConsumo,
            categoriasIngreso,
            categoriasEgreso
        };
    }, [balance, desgloseCategorias]);

    return (
        <main className="container py-4">
            {/* Encabezado */}
            <section className="card-finanzas p-4 mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                        <h1 className="h3 fw-bold text-[#3B5266] mb-1">
                            Análisis de Presupuesto y Categorías
                        </h1>
                        <p className="text-sm text-slate-600 mb-0">
                            Visualización expandida de la proporción de ingresos contra egresos y desglose completo por categoría presupuestal.
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
                            onClick={() => onNavigate('metas')}
                        >
                            Simular Meta →
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

            {/* Resumen Financiero Ejecutivo */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div
                        className="card-finanzas p-3.5 h-100 border-top border-4"
                        style={{ borderTopColor: '#3B5266' }}
                    >
                        <span className="text-xs fw-bold uppercase text-slate-500 d-block mb-1">
                            SALDO TOTAL DISPONIBLE
                        </span>
                        <div className="h4 fw-bold text-[#3B5266] mb-1">
                            {formatMoney(analisis.saldoActual)}
                        </div>
                        <span className="text-xs text-slate-500">
                            Base inicial: {formatMoney(balance.saldoBase)}
                        </span>
                    </div>
                </div>

                <div className="col-6 col-lg-3">
                    <div
                        className="card-finanzas p-3.5 h-100 border-top border-4"
                        style={{ borderTopColor: '#1D4ED8' }}
                    >
                        <span className="text-xs fw-bold uppercase text-slate-500 d-block mb-1">
                            FLUJO NETO DEL PERIODO
                        </span>
                        <div
                            className={`h4 fw-bold mb-1 ${
                                analisis.balanceNetoMes >= 0 ? 'text-success' : 'text-danger'
                            }`}
                        >
                            {(analisis.balanceNetoMes >= 0 ? '+' : '') +
                                formatMoney(analisis.balanceNetoMes)}
                        </div>
                        <span className="text-xs text-slate-500">
                            {balance.totalMovimientos || 0} movimientos totales
                        </span>
                    </div>
                </div>

                <div className="col-6 col-lg-3">
                    <div
                        className="card-finanzas p-3.5 h-100 border-top border-4"
                        style={{ borderTopColor: '#15803D' }}
                    >
                        <span className="text-xs fw-bold uppercase text-slate-500 d-block mb-1">
                            TASA DE AHORRO LIBRE
                        </span>
                        <div className="h4 fw-bold text-success mb-1">{analisis.tasaAhorro}%</div>
                        <span className="text-xs text-slate-500">
                            Porcentaje de ingresos conservado
                        </span>
                    </div>
                </div>

                <div className="col-6 col-lg-3">
                    <div
                        className="card-finanzas p-3.5 h-100 border-top border-4"
                        style={{ borderTopColor: '#B91C1C' }}
                    >
                        <span className="text-xs fw-bold uppercase text-slate-500 d-block mb-1">
                            ABSORCIÓN DE GASTOS
                        </span>
                        <div className="h4 fw-bold text-danger mb-1">{analisis.indiceConsumo}%</div>
                        <span className="text-xs text-slate-500">
                            Nivel de gasto respecto al ingreso
                        </span>
                    </div>
                </div>
            </div>

            {/* Barra Proporcional Expandida a Pantalla Completa */}
            <section className="card-finanzas mb-4">
                <div className="card-header-inst d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <span>Proporción General de Presupuesto (Pantalla Completa)</span>
                    <span className="badge-aqua">
                        Volumen Total: {formatMoney(analisis.totalIngresos + analisis.totalEgresos)}
                    </span>
                </div>
                <div className="p-4">
                    <div className="row g-4 align-items-center">
                        <div className="col-12 col-lg-8">
                            <div className="d-flex justify-content-between text-xs fw-bold mb-2">
                                <span className="text-success">
                                    ▲ Ingresos: {formatMoney(analisis.totalIngresos)} (
                                    {balance.porcentajeIngresos}%)
                                </span>
                                <span className="text-danger">
                                    ▼ Egresos: {formatMoney(analisis.totalEgresos)} (
                                    {balance.porcentajeEgresos}%)
                                </span>
                            </div>
                            <div
                                className="progress mb-3"
                                style={{
                                    height: '22px',
                                    backgroundColor: '#E2E8F0',
                                    borderRadius: '9999px',
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    className="progress-bar bg-success fw-bold text-xs"
                                    role="progressbar"
                                    style={{ width: `${balance.porcentajeIngresos}%` }}
                                >
                                    {balance.porcentajeIngresos > 10
                                        ? `${balance.porcentajeIngresos}%`
                                        : ''}
                                </div>
                                <div
                                    className="progress-bar bg-danger fw-bold text-xs"
                                    role="progressbar"
                                    style={{ width: `${balance.porcentajeEgresos}%` }}
                                >
                                    {balance.porcentajeEgresos > 10
                                        ? `${balance.porcentajeEgresos}%`
                                        : ''}
                                </div>
                            </div>

                            <div className="d-flex justify-content-between text-xs fw-bold mb-1">
                                <span className="text-[#3B5266]">
                                    Distribución del Ingreso (Consumo vs. Margen de Ahorro)
                                </span>
                                <span className="text-[#1D4ED8]">
                                    {analisis.indiceConsumo}% Gastado / {analisis.tasaAhorro}% Disponible
                                </span>
                            </div>
                            <div
                                className="progress"
                                style={{
                                    height: '14px',
                                    backgroundColor: '#DCFCE7',
                                    borderRadius: '9999px',
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    className="progress-bar bg-danger"
                                    role="progressbar"
                                    style={{ width: `${analisis.indiceConsumo}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="col-12 col-lg-4">
                            <div className="p-3 rounded border border-[#CFD8DC] bg-[#F8FAFC]">
                                <div className="text-xs fw-bold uppercase text-[#3B5266] mb-2">
                                    Diagnóstico de Salud Presupuestal
                                </div>
                                <p className="text-xs text-slate-600 mb-2">
                                    {analisis.totalIngresos === 0 && analisis.totalEgresos === 0
                                        ? 'Registra tus primeros ingresos y egresos para obtener un análisis detallado del comportamiento de tu presupuesto.'
                                        : analisis.balanceNetoMes >= 0
                                        ? `Presentas un superávit de ${formatMoney(
                                              analisis.balanceNetoMes
                                          )}. Conservas el ${analisis.tasaAhorro}% de tus ingresos registrados.`
                                        : `Presentas un déficit en el periodo por ${formatMoney(
                                              Math.abs(analisis.balanceNetoMes)
                                          )}. Se recomienda revisar las categorías de gasto con mayor peso.`}
                                </p>
                                <div className="d-flex justify-content-between text-xs pt-2 border-top border-[#CFD8DC]">
                                    <span>Movimientos de Ingreso:</span>
                                    <strong className="text-success">{balance.conteoIngresos}</strong>
                                </div>
                                <div className="d-flex justify-content-between text-xs mt-1">
                                    <span>Movimientos de Egreso:</span>
                                    <strong className="text-danger">{balance.conteoEgresos}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Desglose Completo de las 16 Categorías (8 Ingresos y 8 Egresos) */}
            <div className="row g-4 align-items-start">
                {/* Columna de Categorías de Ingreso */}
                <div className="col-12 col-lg-6">
                    <section className="card-finanzas">
                        <div className="card-header-inst d-flex justify-content-between align-items-center">
                            <span>Fuentes de Ingreso (8 Categorías)</span>
                            <span className="badge-income">
                                {formatMoney(analisis.totalIngresos)}
                            </span>
                        </div>
                        <div className="p-4 d-flex flex-column gap-3">
                            {analisis.categoriasIngreso.map((item) => (
                                <div
                                    key={item.categoria}
                                    className="p-3 rounded border border-[#CFD8DC] bg-[#F8FAFC]"
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bold text-sm text-[#3B5266]">
                                                {item.categoria}
                                            </span>
                                            <span className="badge-aqua">{item.cantidad} mov.</span>
                                        </div>
                                        <div className="text-end">
                                            <strong className="text-sm text-success">
                                                {formatMoney(item.totalIngresos)}
                                            </strong>
                                            <span className="text-xs text-slate-500 ms-2">
                                                ({item.porcentajeRubro}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        className="progress"
                                        style={{
                                            height: '8px',
                                            backgroundColor: '#E2E8F0',
                                            borderRadius: '9999px',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div
                                            className="progress-bar bg-success"
                                            role="progressbar"
                                            style={{ width: `${item.porcentajeRubro}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Columna de Categorías de Egreso */}
                <div className="col-12 col-lg-6">
                    <section className="card-finanzas">
                        <div className="card-header-inst d-flex justify-content-between align-items-center">
                            <span>Distribución de Gastos / Egresos (8 Categorías)</span>
                            <span className="badge-expense">
                                {formatMoney(analisis.totalEgresos)}
                            </span>
                        </div>
                        <div className="p-4 d-flex flex-column gap-3">
                            {analisis.categoriasEgreso.map((item) => (
                                <div
                                    key={item.categoria}
                                    className="p-3 rounded border border-[#CFD8DC] bg-[#F8FAFC]"
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bold text-sm text-[#3B5266]">
                                                {item.categoria}
                                            </span>
                                            <span className="badge-aqua">{item.cantidad} mov.</span>
                                        </div>
                                        <div className="text-end">
                                            <strong className="text-sm text-danger">
                                                {formatMoney(item.totalEgresos)}
                                            </strong>
                                            <span className="text-xs text-slate-500 ms-2">
                                                ({item.porcentajeRubro}% del gasto)
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        className="progress"
                                        style={{
                                            height: '8px',
                                            backgroundColor: '#E2E8F0',
                                            borderRadius: '9999px',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div
                                            className="progress-bar bg-danger"
                                            role="progressbar"
                                            style={{ width: `${item.porcentajeRubro}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <FrameworkBadge />
        </main>
    );
}

