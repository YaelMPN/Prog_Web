/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/App.jsx
 * Framework: React + TypeScript + Bootstrap 5 (Capa View - Arquitectura MVC)
 * Rol Arquitectónico: Componente raíz que consume los endpoints REST del
 * backend en ASP.NET Core (http://localhost:5000/api/finanzas) mediante el
 * servicio tipado finanzasApi.ts y coordina las 5 vistas del sistema.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import MovimientosView from './views/MovimientosView';
import ReportesView from './views/ReportesView';
import MetasView from './views/MetasView';
import AnaliticaView from './views/AnaliticaView';
import { finanzasApi } from './services/finanzasApi';

const CATALOGO_BASE = [
    { categoria: 'Sueldo', tipoSugerido: 'Ingreso' },
    { categoria: 'Inversión', tipoSugerido: 'Ingreso' },
    { categoria: 'Ventas / Negocio', tipoSugerido: 'Ingreso' },
    { categoria: 'Honorarios / Freelance', tipoSugerido: 'Ingreso' },
    { categoria: 'Bonos y Aguinaldo', tipoSugerido: 'Ingreso' },
    { categoria: 'Beca / Apoyo', tipoSugerido: 'Ingreso' },
    { categoria: 'Reembolsos', tipoSugerido: 'Ingreso' },
    { categoria: 'Otros (Ingresos)', tipoSugerido: 'Ingreso' },
    { categoria: 'Alimentos', tipoSugerido: 'Egreso' },
    { categoria: 'Transporte', tipoSugerido: 'Egreso' },
    { categoria: 'Servicios', tipoSugerido: 'Egreso' },
    { categoria: 'Vivienda / Renta', tipoSugerido: 'Egreso' },
    { categoria: 'Salud y Farmacia', tipoSugerido: 'Egreso' },
    { categoria: 'Educación', tipoSugerido: 'Egreso' },
    { categoria: 'Ocio', tipoSugerido: 'Egreso' },
    { categoria: 'Otros (Gastos)', tipoSugerido: 'Egreso' }
];

function calcularEstadoLocal(saldoBase, transacciones) {
    const base = Number(parseFloat(saldoBase || 0).toFixed(2));
    const ingresosList = transacciones.filter((t) => t.tipo === 'Ingreso');
    const egresosList = transacciones.filter((t) => t.tipo === 'Egreso');

    const totalIngresos = Number(
        ingresosList.reduce((acc, item) => acc + Number(item.monto), 0).toFixed(2)
    );
    const totalEgresos = Number(
        egresosList.reduce((acc, item) => acc + Number(item.monto), 0).toFixed(2)
    );
    const balanceNetoMes = Number((totalIngresos - totalEgresos).toFixed(2));
    const saldoActual = Number((base + balanceNetoMes).toFixed(2));

    const volumen = totalIngresos + totalEgresos;
    const porcentajeIngresos = volumen > 0 ? Math.round((totalIngresos / volumen) * 100) : 0;
    const porcentajeEgresos = volumen > 0 ? 100 - porcentajeIngresos : 0;

    const mapa = {};
    CATALOGO_BASE.forEach((c) => {
        mapa[c.categoria] = {
            categoria: c.categoria,
            tipoSugerido: c.tipoSugerido,
            totalIngresos: 0,
            totalEgresos: 0,
            cantidad: 0
        };
    });

    transacciones.forEach((tx) => {
        if (!mapa[tx.categoria]) {
            mapa[tx.categoria] = {
                categoria: tx.categoria,
                tipoSugerido: tx.tipo,
                totalIngresos: 0,
                totalEgresos: 0,
                cantidad: 0
            };
        }
        if (tx.tipo === 'Ingreso') {
            mapa[tx.categoria].totalIngresos = Number(
                (mapa[tx.categoria].totalIngresos + Number(tx.monto)).toFixed(2)
            );
        } else {
            mapa[tx.categoria].totalEgresos = Number(
                (mapa[tx.categoria].totalEgresos + Number(tx.monto)).toFixed(2)
            );
        }
        mapa[tx.categoria].cantidad += 1;
    });

    return {
        balance: {
            saldoBase: base,
            totalIngresos,
            totalEgresos,
            balanceNetoMes,
            saldoActual,
            conteoIngresos: ingresosList.length,
            conteoEgresos: egresosList.length,
            totalMovimientos: transacciones.length,
            porcentajeIngresos,
            porcentajeEgresos
        },
        desgloseCategorias: Object.values(mapa)
    };
}

export default function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [transactions, setTransactions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [balance, setBalance] = useState({
        saldoBase: 0,
        totalIngresos: 0,
        totalEgresos: 0,
        balanceNetoMes: 0,
        saldoActual: 0,
        conteoIngresos: 0,
        conteoEgresos: 0,
        totalMovimientos: 0,
        porcentajeIngresos: 0,
        porcentajeEgresos: 0
    });
    const [desgloseCategorias, setDesgloseCategorias] = useState(() =>
        calcularEstadoLocal(0, []).desgloseCategorias
    );

    const formatMoney = useCallback((value) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(Number(value || 0));
    }, []);

    const applyServerPayload = useCallback((data) => {
        if (!data) return;
        if (data.balance) setBalance(data.balance);
        if (Array.isArray(data.transacciones)) setTransactions(data.transacciones);
        if (Array.isArray(data.desgloseCategorias)) setDesgloseCategorias(data.desgloseCategorias);
        if (Array.isArray(data.notificaciones)) setNotifications(data.notificaciones);
    }, []);

    const fetchEstadoServidor = useCallback(async () => {
        try {
            const [dataBalance, dataMovs] = await Promise.all([
                finanzasApi.obtenerBalance(),
                finanzasApi.obtenerMovimientos()
            ]);
            if (dataMovs && dataMovs.ok) {
                applyServerPayload(dataMovs);
            } else if (dataBalance && dataBalance.ok) {
                applyServerPayload(dataBalance);
            }
        } catch (err) {
            // Mantiene el estado local en React si el servidor .NET aún no se ha iniciado
        }
    }, [applyServerPayload]);

    useEffect(() => {
        fetchEstadoServidor();
    }, [fetchEstadoServidor]);

    const handleAddTransaction = async (txData) => {
        try {
            const data = await finanzasApi.registrarMovimiento(txData);
            if (!data.ok) {
                return data;
            }
            applyServerPayload(data);
            return data;
        } catch (err) {
            const nuevaTx = {
                id: 'MOV-' + Math.floor(1000 + Math.random() * 9000),
                tipo: txData.tipo === 'Egreso' ? 'Egreso' : 'Ingreso',
                monto: Number(parseFloat(txData.monto || 0).toFixed(2)),
                categoria: txData.categoria,
                fecha: txData.fecha,
                descripcion: txData.descripcion,
                timestamp: Date.now()
            };
            const nuevasTx = [nuevaTx, ...transactions];
            const calc = calcularEstadoLocal(balance.saldoBase, nuevasTx);
            const signo = nuevaTx.tipo === 'Ingreso' ? '+' : '-';
            const notif = {
                id: 'NOTIF-' + Date.now(),
                texto: `Notificación ${notifications.length + 1}: ${nuevaTx.tipo} registrado (${
                    nuevaTx.categoria
                }) por ${signo}${formatMoney(nuevaTx.monto)}`,
                hora: new Date().toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
            setTransactions(nuevasTx);
            setBalance(calc.balance);
            setDesgloseCategorias(calc.desgloseCategorias);
            setNotifications((prev) => [notif, ...prev]);
            return { ok: true, movimiento: nuevaTx };
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            const data = await finanzasApi.eliminarMovimiento(id);
            if (data && data.ok) {
                applyServerPayload(data);
                return;
            }
        } catch (err) {
            // Fallback local
        }

        const txEliminada = transactions.find((t) => t.id === id);
        const nuevasTx = transactions.filter((t) => t.id !== id);
        const calc = calcularEstadoLocal(balance.saldoBase, nuevasTx);
        const notif = {
            id: 'NOTIF-' + Date.now(),
            texto: `Notificación ${notifications.length + 1}: Movimiento eliminado (${
                txEliminada ? txEliminada.categoria : id
            })`,
            hora: new Date().toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        setTransactions(nuevasTx);
        setBalance(calc.balance);
        setDesgloseCategorias(calc.desgloseCategorias);
        setNotifications((prev) => [notif, ...prev]);
    };

    const handleUpdateSaldoBase = async (nuevoSaldo) => {
        try {
            const data = await finanzasApi.actualizarSaldoBase(nuevoSaldo);
            if (data && data.ok) {
                applyServerPayload(data);
                return;
            }
        } catch (err) {
            // Fallback local
        }

        const calc = calcularEstadoLocal(nuevoSaldo, transactions);
        const notif = {
            id: 'NOTIF-' + Date.now(),
            texto: `Notificación ${notifications.length + 1}: Saldo inicial actualizado a ${formatMoney(
                nuevoSaldo
            )}`,
            hora: new Date().toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        setBalance(calc.balance);
        setDesgloseCategorias(calc.desgloseCategorias);
        setNotifications((prev) => [notif, ...prev]);
    };

    return (
        <>
            <Navbar
                activeView={activeView}
                onSelectView={setActiveView}
                saldoActual={balance.saldoActual}
                notifications={notifications}
                formatMoney={formatMoney}
            />

            {activeView === 'dashboard' && (
                <DashboardView
                    balance={balance}
                    transactions={transactions}
                    desgloseCategorias={desgloseCategorias}
                    onRefresh={fetchEstadoServidor}
                    onUpdateSaldoBase={handleUpdateSaldoBase}
                    onNavigate={setActiveView}
                    formatMoney={formatMoney}
                />
            )}

            {activeView === 'movimientos' && (
                <MovimientosView
                    balance={balance}
                    transactions={transactions}
                    onAddTransaction={handleAddTransaction}
                    onNavigate={setActiveView}
                    formatMoney={formatMoney}
                />
            )}

            {activeView === 'reportes' && (
                <ReportesView
                    balance={balance}
                    transactions={transactions}
                    onDeleteTransaction={handleDeleteTransaction}
                    onNavigate={setActiveView}
                    formatMoney={formatMoney}
                />
            )}

            {activeView === 'metas' && (
                <MetasView
                    balance={balance}
                    onNavigate={setActiveView}
                    formatMoney={formatMoney}
                />
            )}

            {activeView === 'analitica' && (
                <AnaliticaView
                    balance={balance}
                    desgloseCategorias={desgloseCategorias}
                    onNavigate={setActiveView}
                    formatMoney={formatMoney}
                />
            )}
        </>
    );
}
