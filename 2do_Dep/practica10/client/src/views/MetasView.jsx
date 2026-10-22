/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: client/src/views/MetasView.jsx
 * Framework: React + TypeScript (finanzasApi.ts) + Bootstrap 5 (Grid y Tarjetas)
 * Rol Arquitectónico: Pantalla 4 (Simulador de Metas de Ahorro) que permite
 * crear, listar y eliminar metas de ahorro por usuario, calculando en tiempo
 * real la cuota mensual necesaria y la cobertura del flujo disponible.
 * ============================================================================
 */

import React, { useState, useMemo, useEffect } from 'react';
import FrameworkBadge from '../components/FrameworkBadge';

export default function MetasView({
    balance,
    metas = [],
    onAddMeta,
    onDeleteMeta,
    onNavigate,
    formatMoney
}) {
    const [nombreMeta, setNombreMeta] = useState('Fondo de Emergencia / Meta Personal');
    const [montoObjetivo, setMontoObjetivo] = useState('12000');
    const [plazoMeses, setPlazoMeses] = useState('6');
    const [usarSaldoActual, setUsarSaldoActual] = useState(false);
    const [metasGuardadas, setMetasGuardadas] = useState([]);
    const [modalInfo, setModalInfo] = useState({
        activo: false,
        esExito: false,
        titulo: 'Aviso',
        mensaje: ''
    });

    useEffect(() => {
        if (Array.isArray(metas)) {
            setMetasGuardadas(
                metas.map((m) => ({
                    id: m.id,
                    nombre: m.nombre,
                    montoObjetivo: m.montoObjetivo,
                    plazoMeses: m.plazoMeses,
                    cuotaMensual: m.cuotaMensualRequerida ?? m.cuotaMensual ?? 0,
                    viable: Boolean(
                        m.viable ?? (m.cubiertaPorFlujoMensual || m.cubiertaPorSaldoActual)
                    )
                }))
            );
        }
    }, [metas]);

    const simulacion = useMemo(() => {
        const metaNum = Math.max(0, parseFloat(montoObjetivo) || 0);
        const mesesNum = Math.max(1, parseInt(plazoMeses, 10) || 1);

        const saldoDisponible = Math.max(0, Number(balance.saldoActual || 0));
        const flujoMensualNeto = Number(balance.balanceNetoMes || 0);

        const capitalInicialAplicado = usarSaldoActual
            ? Math.min(metaNum, saldoDisponible)
            : 0;

        const montoRestante = Math.max(0, metaNum - capitalInicialAplicado);
        const cuotaMensualRequerida = mesesNum > 0 ? montoRestante / mesesNum : montoRestante;

        const cubiertaPorSaldoActual = metaNum > 0 && saldoDisponible >= metaNum;
        const cubiertaPorFlujoMensual =
            metaNum > 0 && (montoRestante === 0 || flujoMensualNeto >= cuotaMensualRequerida);

        const diferenciaFlujoMensual = flujoMensualNeto - cuotaMensualRequerida;

        const porcentajeCoberturaSaldo =
            metaNum > 0 ? Math.min(100, Math.round((saldoDisponible / metaNum) * 100)) : 0;

        const porcentajeCoberturaFlujo =
            cuotaMensualRequerida > 0
                ? Math.min(
                      100,
                      Math.max(0, Math.round((flujoMensualNeto / cuotaMensualRequerida) * 100))
                  )
                : metaNum > 0
                ? 100
                : 0;

        const hitos = [0.25, 0.5, 0.75, 1].map((fraccion) => {
            const mesHito = Math.max(1, Math.round(mesesNum * fraccion));
            const ahorroAcumulado = capitalInicialAplicado + montoRestante * fraccion;
            return {
                etapa: `${Math.round(fraccion * 100)}%`,
                mes: `Mes ${mesHito}`,
                monto: Number(ahorroAcumulado.toFixed(2))
            };
        });

        return {
            metaNum: Number(metaNum.toFixed(2)),
            mesesNum,
            saldoDisponible,
            flujoMensualNeto,
            capitalInicialAplicado: Number(capitalInicialAplicado.toFixed(2)),
            montoRestante: Number(montoRestante.toFixed(2)),
            cuotaMensualRequerida: Number(cuotaMensualRequerida.toFixed(2)),
            cubiertaPorSaldoActual,
            cubiertaPorFlujoMensual,
            diferenciaFlujoMensual: Number(diferenciaFlujoMensual.toFixed(2)),
            porcentajeCoberturaSaldo,
            porcentajeCoberturaFlujo,
            hitos
        };
    }, [montoObjetivo, plazoMeses, usarSaldoActual, balance]);

    const handleGuardarEscenario = async (e) => {
        e.preventDefault();

        if (!nombreMeta.trim()) {
            setModalInfo({
                activo: true,
                esExito: false,
                titulo: 'Concepto requerido',
                mensaje: 'Ingresa un nombre o concepto para identificar tu meta de ahorro.'
            });
            return;
        }

        if (simulacion.metaNum <= 0) {
            setModalInfo({
                activo: true,
                esExito: false,
                titulo: 'Monto inválido',
                mensaje: 'El monto objetivo de la meta debe ser mayor a $0.00.'
            });
            return;
        }

        if (onAddMeta) {
            const res = await onAddMeta({
                nombre: nombreMeta.trim(),
                montoObjetivo: simulacion.metaNum,
                plazoMeses: simulacion.mesesNum,
                usarSaldoActual
            });

            if (res && res.ok && res.meta) {
                const m = res.meta;
                setModalInfo({
                    activo: true,
                    esExito: true,
                    titulo: 'Simulación Guardada',
                    mensaje: `Se guardó el escenario "${m.nombre}" con una cuota de ${formatMoney(
                        m.cuotaMensualRequerida
                    )} al mes durante ${m.plazoMeses} meses.`
                });
                return;
            }
        }

        const nuevaMeta = {
            id: 'META-' + Math.floor(1000 + Math.random() * 9000),
            nombre: nombreMeta.trim(),
            montoObjetivo: simulacion.metaNum,
            plazoMeses: simulacion.mesesNum,
            cuotaMensual: simulacion.cuotaMensualRequerida,
            viable: simulacion.cubiertaPorFlujoMensual || simulacion.cubiertaPorSaldoActual
        };

        setMetasGuardadas((prev) => [nuevaMeta, ...prev]);
        setModalInfo({
            activo: true,
            esExito: true,
            titulo: 'Simulación Guardada',
            mensaje: `Se guardó el escenario "${nuevaMeta.nombre}" con una cuota de ${formatMoney(
                nuevaMeta.cuotaMensual
            )} al mes durante ${nuevaMeta.plazoMeses} meses.`
        });
    };

    const handleEliminarEscenario = async (id) => {
        if (onDeleteMeta) {
            await onDeleteMeta(id);
        }
        setMetasGuardadas((prev) => prev.filter((m) => m.id !== id));
    };

    return (
        <main className="container py-4">
            {/* Encabezado */}
            <section className="card-finanzas p-4 mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                        <h1 className="h3 fw-bold text-[#3B5266] mb-1">
                            Simulador de Metas de Ahorro
                        </h1>
                        <p className="text-sm text-slate-600 mb-0">
                            Calcula cuánto necesitas ahorrar al mes para alcanzar una meta fija y valida si tu saldo y flujo actual lo cubren.
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary text-sm fw-semibold"
                            onClick={() => onNavigate('dashboard')}
                        >
                            ← Dashboard
                        </button>
                        <button
                            type="button"
                            className="btn-royal text-sm"
                            onClick={() => onNavigate('movimientos')}
                        >
                            + Registrar Ingreso / Gasto
                        </button>
                    </div>
                </div>
            </section>

            {/* Tarjetas de Contexto Financiero Actual vs Meta */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div
                        className="card-finanzas p-4 h-100 border-top border-4"
                        style={{ borderTopColor: '#3B5266' }}
                    >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="text-xs fw-bold uppercase tracking-wider text-slate-500">
                                SALDO ACTUAL EN CUENTA
                            </span>
                            <span className="badge-aqua">Disponible</span>
                        </div>
                        <div className="h2 fw-bold text-[#3B5266] mb-2">
                            {formatMoney(balance.saldoActual)}
                        </div>
                        <div className="pt-2 border-top border-[#CFD8DC] text-xs text-slate-600">
                            Cubre el <strong>{simulacion.porcentajeCoberturaSaldo}%</strong> de la meta de forma inmediata
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div
                        className="card-finanzas p-4 h-100 border-top border-4"
                        style={{ borderTopColor: '#1D4ED8' }}
                    >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="text-xs fw-bold uppercase tracking-wider text-slate-500">
                                AHORRO MENSUAL REQUERIDO
                            </span>
                            <span className="badge-aqua">{simulacion.mesesNum} meses</span>
                        </div>
                        <div className="h2 fw-bold text-[#1D4ED8] mb-2">
                            {formatMoney(simulacion.cuotaMensualRequerida)}
                            <span className="text-xs fw-normal text-slate-500"> / mes</span>
                        </div>
                        <div className="pt-2 border-top border-[#CFD8DC] text-xs text-slate-600">
                            Monto por reunir: <strong>{formatMoney(simulacion.montoRestante)}</strong>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div
                        className="card-finanzas p-4 h-100 border-top border-4"
                        style={{
                            borderTopColor:
                                simulacion.cubiertaPorFlujoMensual || simulacion.cubiertaPorSaldoActual
                                    ? '#15803D'
                                    : '#B91C1C'
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="text-xs fw-bold uppercase tracking-wider text-slate-500">
                                VALIDACIÓN DE FLUJO ACTUAL
                            </span>
                            <span
                                className={
                                    simulacion.cubiertaPorFlujoMensual ||
                                    simulacion.cubiertaPorSaldoActual
                                        ? 'badge-income'
                                        : 'badge-expense'
                                }
                            >
                                {simulacion.cubiertaPorSaldoActual
                                    ? '✓ Cubierta por Saldo'
                                    : simulacion.cubiertaPorFlujoMensual
                                    ? '✓ Flujo Suficiente'
                                    : '⚠ Flujo Insuficiente'}
                            </span>
                        </div>
                        <div
                            className={`h2 fw-bold mb-2 ${
                                balance.balanceNetoMes >= 0 ? 'text-success' : 'text-danger'
                            }`}
                        >
                            {(balance.balanceNetoMes >= 0 ? '+' : '') +
                                formatMoney(balance.balanceNetoMes)}
                        </div>
                        <div className="pt-2 border-top border-[#CFD8DC] text-xs text-slate-600">
                            Flujo neto actual (Ingresos − Egresos)
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 align-items-start">
                {/* Columna Izquierda: Configurador de Meta */}
                <div className="col-12 col-lg-5">
                    <section className="card-finanzas">
                        <div className="card-header-inst">
                            <span>Configurar Meta de Ahorro</span>
                        </div>
                        <div className="p-4">
                            <form onSubmit={handleGuardarEscenario} noValidate>
                                <div className="mb-3">
                                    <label className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1">
                                        Nombre o Concepto de la Meta *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control form-control-finanzas"
                                        placeholder="Ej. Fondo de Emergencia, Laptop, Viaje..."
                                        value={nombreMeta}
                                        onChange={(e) => setNombreMeta(e.target.value)}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1">
                                        Monto Fijo de la Meta ($) *
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-[#F4F6F8] border-[#CFD8DC] fw-bold text-[#3B5266]">
                                            $
                                        </span>
                                        <input
                                            type="number"
                                            step="100"
                                            min="1"
                                            className="form-control form-control-finanzas"
                                            placeholder="12000.00"
                                            value={montoObjetivo}
                                            onChange={(e) => setMontoObjetivo(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1">
                                        Plazo Estimado (Meses): <strong>{simulacion.mesesNum} meses</strong>
                                    </label>
                                    <div className="d-flex flex-wrap gap-2 mb-2">
                                        {[3, 6, 12, 18, 24].map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                className={`btn btn-sm ${
                                                    simulacion.mesesNum === m
                                                        ? 'badge-aqua px-3 py-1.5'
                                                        : 'btn-outline-secondary rounded-pill px-3 py-1'
                                                }`}
                                                onClick={() => setPlazoMeses(String(m))}
                                            >
                                                {m} meses
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        className="form-control form-control-finanzas"
                                        value={plazoMeses}
                                        onChange={(e) => setPlazoMeses(e.target.value)}
                                    />
                                </div>

                                <div className="mb-4 p-3 rounded border border-[#CFD8DC] bg-[#F8FAFC]">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="checkUsarSaldo"
                                            checked={usarSaldoActual}
                                            onChange={(e) => setUsarSaldoActual(e.target.checked)}
                                        />
                                        <label
                                            className="form-check-label text-xs fw-semibold text-[#3B5266]"
                                            htmlFor="checkUsarSaldo"
                                        >
                                            Tomar en cuenta mi Saldo Disponible ({formatMoney(balance.saldoActual)}) como base inicial
                                        </label>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2 pt-2 border-top border-[#CFD8DC]">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary fw-semibold"
                                        onClick={() => {
                                            setNombreMeta('Fondo de Emergencia / Meta Personal');
                                            setMontoObjetivo('12000');
                                            setPlazoMeses('6');
                                            setUsarSaldoActual(false);
                                        }}
                                    >
                                        Restablecer
                                    </button>
                                    <button type="submit" className="btn-royal">
                                        Guardar Simulación
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>

                {/* Columna Derecha: Diagnóstico de Viabilidad y Proyección */}
                <div className="col-12 col-lg-7">
                    <section className="card-finanzas mb-4">
                        <div className="card-header-inst d-flex justify-content-between align-items-center">
                            <span>Diagnóstico de Viabilidad Financiera</span>
                            <span className="badge-aqua">Cálculo en Vivo</span>
                        </div>
                        <div className="p-4">
                            <div
                                className={`p-3 rounded border mb-3 ${
                                    simulacion.cubiertaPorSaldoActual ||
                                    simulacion.cubiertaPorFlujoMensual
                                        ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                                        : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]'
                                }`}
                            >
                                <div className="fw-bold text-sm mb-1">
                                    {simulacion.cubiertaPorSaldoActual
                                        ? '¡Tu saldo actual disponible ya cubre el 100% de esta meta!'
                                        : simulacion.cubiertaPorFlujoMensual
                                        ? '¡Meta Viable! Tu flujo neto mensual cubre la cuota de ahorro requerida.'
                                        : 'Atención: Tu flujo mensual actual aún no cubre la cuota mensual requerida.'}
                                </div>
                                <p className="text-xs mb-0">
                                    {simulacion.cubiertaPorSaldoActual ? (
                                        <>
                                            Cuentas con <strong>{formatMoney(balance.saldoActual)}</strong> disponibles para cubrir la meta de{' '}
                                            <strong>{formatMoney(simulacion.metaNum)}</strong> manteniendo un remanente de{' '}
                                            <strong>{formatMoney(balance.saldoActual - simulacion.metaNum)}</strong>.
                                        </>
                                    ) : simulacion.cubiertaPorFlujoMensual ? (
                                        <>
                                            Necesitas ahorrar <strong>{formatMoney(simulacion.cuotaMensualRequerida)}</strong> al mes durante{' '}
                                            <strong>{simulacion.mesesNum} meses</strong>. Después de separar tu cuota mensual, aún te queda un margen libre de{' '}
                                            <strong>{formatMoney(simulacion.diferenciaFlujoMensual)}</strong> por mes.
                                        </>
                                    ) : (
                                        <>
                                            La cuota mensual es de <strong>{formatMoney(simulacion.cuotaMensualRequerida)}</strong>, pero tu flujo neto actual es de{' '}
                                            <strong>{formatMoney(balance.balanceNetoMes)}</strong>. Necesitas incrementar ingresos o reducir gastos en{' '}
                                            <strong>{formatMoney(Math.abs(simulacion.diferenciaFlujoMensual))}</strong> mensuales (o ampliar el plazo de ahorro).
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between text-xs fw-bold mb-1">
                                    <span className="text-[#3B5266]">
                                        Cobertura de la Cuota Mensual con tu Flujo Actual
                                    </span>
                                    <span className="text-[#1D4ED8]">
                                        {simulacion.porcentajeCoberturaFlujo}%
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
                                        className={`progress-bar ${
                                            simulacion.porcentajeCoberturaFlujo >= 100
                                                ? 'bg-success'
                                                : 'bg-primary'
                                        }`}
                                        role="progressbar"
                                        style={{ width: `${simulacion.porcentajeCoberturaFlujo}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="text-xs fw-bold uppercase text-[#3B5266] mb-2">
                                Proyección Escalonada de Ahorro ({simulacion.mesesNum} meses)
                            </div>
                            <div className="row g-2">
                                {simulacion.hitos.map((hito) => (
                                    <div key={hito.etapa} className="col-6 col-sm-3">
                                        <div className="p-2.5 rounded border border-[#CFD8DC] bg-[#F8FAFC] text-center">
                                            <span className="badge-aqua mb-1">{hito.etapa}</span>
                                            <div className="text-xs text-slate-500">{hito.mes}</div>
                                            <strong className="text-sm text-[#3B5266] d-block mt-0.5">
                                                {formatMoney(hito.monto)}
                                            </strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Tabla de Metas Guardadas */}
                    <section className="card-finanzas">
                        <div className="card-header-inst d-flex justify-content-between align-items-center">
                            <span>Escenarios de Ahorro Guardados</span>
                            <span className="badge-aqua">{metasGuardadas.length} metas</span>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="text-xs uppercase text-slate-500">Meta</th>
                                        <th className="text-xs uppercase text-slate-500 text-end">Objetivo</th>
                                        <th className="text-xs uppercase text-slate-500 text-center">Plazo</th>
                                        <th className="text-xs uppercase text-slate-500 text-end">Cuota / Mes</th>
                                        <th className="text-xs uppercase text-slate-500 text-center">Estado</th>
                                        <th className="text-xs uppercase text-slate-500 text-center">Quitar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metasGuardadas.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4 text-slate-500 text-sm">
                                                Aún no has guardado escenarios. Configura una meta y presiona "Guardar Simulación".
                                            </td>
                                        </tr>
                                    ) : (
                                        metasGuardadas.map((m) => (
                                            <tr key={m.id}>
                                                <td className="fw-semibold text-sm text-[#3B5266]">
                                                    {m.nombre}
                                                </td>
                                                <td className="text-end fw-bold text-sm">
                                                    {formatMoney(m.montoObjetivo)}
                                                </td>
                                                <td className="text-center text-xs">
                                                    <span className="badge-aqua">{m.plazoMeses} meses</span>
                                                </td>
                                                <td className="text-end fw-bold text-[#1D4ED8] text-sm">
                                                    {formatMoney(m.cuotaMensual)}
                                                </td>
                                                <td className="text-center">
                                                    <span
                                                        className={
                                                            m.viable ? 'badge-income' : 'badge-expense'
                                                        }
                                                    >
                                                        {m.viable ? 'Viable' : 'Ajustar'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger py-0 px-2"
                                                        onClick={() => handleEliminarEscenario(m.id)}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* Modal de aviso */}
            <div
                className={`modal-overlay ${modalInfo.activo ? 'activo' : ''}`}
                role="dialog"
                aria-modal="true"
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
