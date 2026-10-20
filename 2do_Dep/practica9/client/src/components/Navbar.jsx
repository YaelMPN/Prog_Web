/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/components/Navbar.jsx
 * Framework: React (Componente Funcional View) + Bootstrap 5 (Grid/Flexbox)
 * Rol Arquitectónico: Barra de navegación superior siempre visible con menú
 * tipo burbuja (.bubble-nav-link), saldo disponible en tiempo real y campana
 * de notificaciones.
 * ============================================================================
 */

import React from 'react';
import Notificaciones from './Notificaciones';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'movimientos', label: 'Movimientos' },
    { id: 'reportes', label: 'Reportes' },
    { id: 'metas', label: 'Metas de Ahorro' },
    { id: 'analitica', label: 'Presupuesto' }
];

export default function Navbar({
    activeView,
    onSelectView,
    saldoActual = 0,
    notifications = [],
    formatMoney
}) {
    return (
        <header className="navbar-finanzas shadow-sm">
            <div className="container">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <a
                        href="#dashboard"
                        className="navbar-brand-title"
                        onClick={(e) => {
                            e.preventDefault();
                            onSelectView('dashboard');
                        }}
                    >
                        <span
                            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-[#00D9FF] text-[#0F172A] fw-bold"
                            style={{ width: '34px', height: '34px' }}
                        >
                            $
                        </span>
                        <span>Finanzas</span>
                    </a>

                    <div
                        id="navbar-authenticated-area"
                        className="d-flex flex-wrap align-items-center justify-content-between flex-grow-1 gap-3 ms-lg-4"
                    >
                        {/* Menú Píldora / Burbuja para las 5 vistas */}
                        <nav className="bubble-nav-container mx-auto" aria-label="Menú Principal">
                            {NAV_ITEMS.map((item) => {
                                const isActive = activeView === item.id;
                                return (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        className={`bubble-nav-link ${isActive ? 'active' : ''}`}
                                        aria-current={isActive ? 'page' : undefined}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onSelectView(item.id);
                                        }}
                                    >
                                        {item.label}
                                    </a>
                                );
                            })}
                        </nav>

                        {/* Área derecha: Saldo disponible en tiempo real y Campana de Notificaciones */}
                        <div className="d-flex align-items-center gap-2 ms-auto">
                            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs">
                                <span className="text-slate-300">Saldo:</span>
                                <strong className="text-[#00D9FF] ms-1" data-nav-balance>
                                    {formatMoney(saldoActual)}
                                </strong>
                            </div>

                            <Notificaciones notifications={notifications} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

