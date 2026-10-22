/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: client/src/App.jsx
 * Framework: React + TypeScript + Bootstrap 5 (Capa View - Arquitectura MVC)
 * Rol Arquitectónico: Componente raíz que gestiona la sesión de usuario
 * autenticada contra SQLite (`LoginView.tsx` y `RegistroView.tsx`) y coordina
 * las 5 pantallas financieras filtradas por `UsuarioId` consumiendo los
 * endpoints de ASP.NET Core (.NET 8 + Entity Framework Core SQLite en 3FN).
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LoginView from './views/LoginView';
import RegistroView from './views/RegistroView';
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

const BALANCE_VACIO = {
    saldoBase: 0,
    limiteMensual: 0,
    totalIngresos: 0,
    totalEgresos: 0,
    balanceNetoMes: 0,
    saldoActual: 0,
    conteoIngresos: 0,
    conteoEgresos: 0,
    totalMovimientos: 0,
    porcentajeIngresos: 0,
    porcentajeEgresos: 0
};

function calcularEstadoLocal(saldoBase, limiteMensual, transacciones) {
    const base = Number(parseFloat(saldoBase || 0).toFixed(2));
    const limite = Number(parseFloat(limiteMensual || 0).toFixed(2));
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
            limiteMensual: limite,
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
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [activeView, setActiveView] = useState('login');
    const [usuariosLocalFallback, setUsuariosLocalFallback] = useState([]);

    const [transactions, setTransactions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [metas, setMetas] = useState([]);
    const [balance, setBalance] = useState(BALANCE_VACIO);
    const [desgloseCategorias, setDesgloseCategorias] = useState(() =>
        calcularEstadoLocal(0, 0, []).desgloseCategorias
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
        if (Array.isArray(data.metas)) setMetas(data.metas);
    }, []);

    const fetchEstadoServidor = useCallback(
        async (uid = usuarioActual?.id) => {
            if (!uid) return;
            try {
                const [dataBalance, dataMovs] = await Promise.all([
                    finanzasApi.obtenerBalance(uid),
                    finanzasApi.obtenerMovimientos(uid)
                ]);
                if (dataMovs && dataMovs.ok) {
                    applyServerPayload(dataMovs);
                } else if (dataBalance && dataBalance.ok) {
                    applyServerPayload(dataBalance);
                }
            } catch (err) {
                // Conserva el estado local si el servidor .NET aún no se ha iniciado
            }
        },
        [usuarioActual?.id, applyServerPayload]
    );

    useEffect(() => {
        if (usuarioActual?.id) {
            fetchEstadoServidor(usuarioActual.id);
        }
    }, [usuarioActual?.id, fetchEstadoServidor]);

    const handleRegister = async (registroData) => {
        try {
            const res = await finanzasApi.registrarUsuario(registroData);
            if (!res || !res.ok || !res.usuario) {
                return (
                    res || {
                        ok: false,
                        titulo: 'Error de registro',
                        message: 'No se pudo completar el registro de la cuenta.'
                    }
                );
            }

            setUsuarioActual(res.usuario);
            if (res.estado) {
                applyServerPayload(res.estado);
            }
            setActiveView('dashboard');
            return res;
        } catch (err) {
            // Fallback local si el servidor .NET no está levantado en ese instante
            const emailNorm = registroData.email.trim().toLowerCase();
            const existe = usuariosLocalFallback.find(
                (u) => u.email.toLowerCase() === emailNorm
            );
            if (existe) {
                return {
                    ok: false,
                    titulo: 'Correo ya registrado',
                    message: 'Ya existe una cuenta registrada con ese correo electrónico.'
                };
            }

            const nuevoUsr = {
                id: usuariosLocalFallback.length + 1,
                nombre: registroData.nombre.trim(),
                email: emailNorm,
                password: registroData.password,
                avatarDataUrl: registroData.avatarDataUrl || '',
                saldoInicial: Number(registroData.saldoInicial || 0),
                limiteMensual: Number(registroData.limiteMensual || 0)
            };

            setUsuariosLocalFallback((prev) => [...prev, nuevoUsr]);
            setUsuarioActual(nuevoUsr);

            const calc = calcularEstadoLocal(
                nuevoUsr.saldoInicial,
                nuevoUsr.limiteMensual,
                []
            );
            const notifBienvenida = {
                id: 'NOTIF-' + Date.now(),
                texto: `Notificación 1: Bienvenido(a) ${
                    nuevoUsr.nombre
                }. Cuenta creada con saldo inicial de ${formatMoney(nuevoUsr.saldoInicial)}`,
                hora: new Date().toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };

            setTransactions([]);
            setMetas([]);
            setBalance(calc.balance);
            setDesgloseCategorias(calc.desgloseCategorias);
            setNotifications([notifBienvenida]);
            setActiveView('dashboard');

            return { ok: true, usuario: nuevoUsr };
        }
    };

    const handleLogin = async (email, password) => {
        try {
            const res = await finanzasApi.loginUsuario({ email, password });
            if (!res || !res.ok || !res.usuario) {
                return (
                    res || {
                        ok: false,
                        codigo: 'USUARIO_NO_ENCONTRADO',
                        titulo: 'Cuenta no encontrada',
                        message:
                            'No existe ninguna cuenta registrada con ese correo electrónico. Crea una cuenta para comenzar.'
                    }
                );
            }

            setUsuarioActual(res.usuario);
            if (res.estado) {
                applyServerPayload(res.estado);
            }
            setActiveView('dashboard');
            return res;
        } catch (err) {
            // Fallback local si el servidor .NET no está levantado
            const emailNorm = email.trim().toLowerCase();
            const encontrado = usuariosLocalFallback.find(
                (u) => u.email.toLowerCase() === emailNorm
            );
            if (!encontrado) {
                return {
                    ok: false,
                    codigo: 'USUARIO_NO_ENCONTRADO',
                    titulo: 'Cuenta no encontrada',
                    message:
                        'No existe ninguna cuenta registrada con ese correo electrónico. Crea una cuenta para comenzar.'
                };
            }
            if (encontrado.password !== password) {
                return {
                    ok: false,
                    codigo: 'PASSWORD_INCORRECTO',
                    titulo: 'Contraseña incorrecta',
                    message:
                        'La contraseña ingresada es incorrecta. Verifica tus credenciales e inténtalo de nuevo.'
                };
            }

            setUsuarioActual(encontrado);
            setActiveView('dashboard');
            return { ok: true, usuario: encontrado };
        }
    };

    const handleLogout = () => {
        setUsuarioActual(null);
        setTransactions([]);
        setNotifications([]);
        setMetas([]);
        setBalance(BALANCE_VACIO);
        setDesgloseCategorias(calcularEstadoLocal(0, 0, []).desgloseCategorias);
        setActiveView('login');
    };

    const handleAddTransaction = async (txData) => {
        const uid = usuarioActual?.id || 1;
        try {
            const data = await finanzasApi.registrarMovimiento({
                usuarioId: uid,
                ...txData
            });
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
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            };
            const nuevasTx = [nuevaTx, ...transactions];
            const calc = calcularEstadoLocal(
                balance.saldoBase,
                balance.limiteMensual,
                nuevasTx
            );
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
        const uid = usuarioActual?.id || 1;
        try {
            const data = await finanzasApi.eliminarMovimiento(id, uid);
            if (data && data.ok) {
                applyServerPayload(data);
                return;
            }
        } catch (err) {
            // Fallback local
        }

        const txEliminada = transactions.find((t) => t.id === id);
        const nuevasTx = transactions.filter((t) => t.id !== id);
        const calc = calcularEstadoLocal(balance.saldoBase, balance.limiteMensual, nuevasTx);
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

    const handleUpdateSaldoBase = async (nuevoSaldo, nuevoLimite) => {
        const uid = usuarioActual?.id || 1;
        try {
            const data = await finanzasApi.actualizarSaldoBase(uid, nuevoSaldo, nuevoLimite);
            if (data && data.ok) {
                applyServerPayload(data);
                return;
            }
        } catch (err) {
            // Fallback local
        }

        const limiteAplicado =
            typeof nuevoLimite === 'number' ? nuevoLimite : balance.limiteMensual;
        const calc = calcularEstadoLocal(nuevoSaldo, limiteAplicado, transactions);
        const notif = {
            id: 'NOTIF-' + Date.now(),
            texto: `Notificación ${notifications.length + 1}: Presupuesto actualizado a ${formatMoney(
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

    const handleAddMeta = async (metaReq) => {
        const uid = usuarioActual?.id || 1;
        try {
            const res = await finanzasApi.calcularMetaAhorro({
                usuarioId: uid,
                ...metaReq
            });
            if (res && res.ok) {
                applyServerPayload(res);
                return res;
            }
        } catch (err) {
            // Fallback local
        }
        return null;
    };

    const handleDeleteMeta = async (metaId) => {
        const uid = usuarioActual?.id || 1;
        try {
            const res = await finanzasApi.eliminarMetaAhorro(metaId, uid);
            if (res && res.ok) {
                applyServerPayload(res);
                return;
            }
        } catch (err) {
            // Fallback local
        }
        setMetas((prev) => prev.filter((m) => m.id !== metaId));
    };

    const sesionIniciada = Boolean(usuarioActual && usuarioActual.id);

    return (
        <>
            <Navbar
                activeView={activeView}
                onSelectView={setActiveView}
                saldoActual={balance.saldoActual}
                notifications={notifications}
                usuario={usuarioActual}
                onLogout={handleLogout}
                formatMoney={formatMoney}
            />

            {!sesionIniciada ? (
                activeView === 'registro' ? (
                    <RegistroView
                        onRegister={handleRegister}
                        onGoToLogin={() => setActiveView('login')}
                    />
                ) : (
                    <LoginView
                        onLogin={handleLogin}
                        onGoToRegister={() => setActiveView('registro')}
                    />
                )
            ) : (
                <>
                    {activeView === 'dashboard' && (
                        <DashboardView
                            balance={balance}
                            transactions={transactions}
                            desgloseCategorias={desgloseCategorias}
                            onRefresh={() => fetchEstadoServidor(usuarioActual.id)}
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
                            metas={metas}
                            onAddMeta={handleAddMeta}
                            onDeleteMeta={handleDeleteMeta}
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
            )}
        </>
    );
}
