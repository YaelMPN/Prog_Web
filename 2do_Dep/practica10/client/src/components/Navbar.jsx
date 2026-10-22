/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: client/src/components/Navbar.jsx
 * Framework: React + TypeScript + Bootstrap 5 (Grid/Flexbox Responsivo)
 * Rol Arquitectónico: Barra de navegación superior unificada y 100% adaptable
 * a móviles (como OnePlus Nord 4), tablets y escritorio:
 * - Izquierda: Burbuja de perfil (foto circular o inicial + primer nombre)
 *   seguida de la marca "YaFinanzas".
 * - Centro (Desktop >= 992px): Menú píldora con las 5 vistas principales.
 * - Derecha: Saldo disponible (compacto en móvil), campana de notificaciones,
 *   botón Cerrar Sesión (en desktop) y botón Menú Burger compacto en móvil/tablet.
 * ============================================================================
 */

import React, { useState } from 'react';
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
    usuario = null,
    onLogout,
    formatMoney
}) {
    const [menuBurgerAbierto, setMenuBurgerAbierto] = useState(false);

    const sesionActiva = Boolean(usuario && usuario.id);
    const nombreCompleto = usuario?.nombre ? usuario.nombre.trim() : '';
    const primerNombre = nombreCompleto ? nombreCompleto.split(/\s+/)[0] : 'Usuario';
    const inicialUsuario = primerNombre ? primerNombre.charAt(0).toUpperCase() : 'U';

    const handleSeleccionarVista = (idVista) => {
        onSelectView(idVista);
        setMenuBurgerAbierto(false);
    };

    const handleCerrarSesionClick = () => {
        setMenuBurgerAbierto(false);
        if (onLogout) {
            onLogout();
        }
    };

    return (
        <header className="navbar-finanzas shadow-sm">
            <div className="container">
                <div className="navbar-layout-row">
                    {/* Izquierda: Burbuja (Foto de Perfil + Primer Nombre) + Marca "YaFinanzas" */}
                    <div className="navbar-brand-wrapper">
                        {sesionActiva && (
                            <div
                                className="user-profile-pill"
                                title={`Sesión activa: ${nombreCompleto} (${usuario.email})`}
                            >
                                {usuario.avatarDataUrl ? (
                                    <img
                                        id="nav-user-avatar"
                                        src={usuario.avatarDataUrl}
                                        alt={primerNombre}
                                        className="user-avatar-nav"
                                    />
                                ) : (
                                    <span id="nav-user-initial" className="user-initial-nav">
                                        {inicialUsuario}
                                    </span>
                                )}
                                <span id="nav-user-name" className="user-firstname-nav">
                                    {primerNombre}
                                </span>
                            </div>
                        )}

                        <a
                            href={sesionActiva ? '#dashboard' : '#login'}
                            className="navbar-brand-title"
                            onClick={(e) => {
                                e.preventDefault();
                                if (sesionActiva) {
                                    handleSeleccionarVista('dashboard');
                                }
                            }}
                        >
                            <span>YaFinanzas</span>
                        </a>
                    </div>

                    {/* Centro (Escritorio >= 992px): Menú Píldora / Burbuja */}
                    {sesionActiva && (
                        <div className="navbar-menu-desktop d-none d-lg-flex">
                            <nav className="bubble-nav-container" aria-label="Menú Principal">
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
                                                handleSeleccionarVista(item.id);
                                            }}
                                        >
                                            {item.label}
                                        </a>
                                    );
                                })}
                            </nav>
                        </div>
                    )}

                    {/* Derecha: Saldo, Campana de Notificaciones, Cerrar Sesión y Botón Burger en Móvil */}
                    {sesionActiva && (
                        <div className="navbar-actions-right">
                            <div className="saldo-pill-nav" title="Saldo actual disponible">
                                <span className="saldo-label-nav">Saldo: </span>
                                <strong className="text-[#00D9FF]" data-nav-balance>
                                    {formatMoney(saldoActual)}
                                </strong>
                            </div>

                            <Notificaciones notifications={notifications} />

                            <button
                                type="button"
                                id="btn-logout"
                                className="btn btn-sm btn-outline-light text-xs fw-semibold rounded-pill px-3 py-1 d-none d-lg-inline-flex align-items-center"
                                onClick={handleCerrarSesionClick}
                                title="Cerrar sesión y volver al Login"
                            >
                                Cerrar Sesión
                            </button>

                            {/* Botón Menú Burger Compacto (Visible en Móvil y Tablet < 992px) */}
                            <button
                                type="button"
                                id="btn-burger-nav"
                                className={`btn-burger-menu d-lg-none ${
                                    menuBurgerAbierto ? 'abierto' : ''
                                }`}
                                onClick={() => setMenuBurgerAbierto((prev) => !prev)}
                                aria-expanded={menuBurgerAbierto}
                                aria-label="Abrir menú de navegación"
                                title="Menú de navegación"
                            >
                                {menuBurgerAbierto ? (
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Panel Desplegable del Menú Burger (Móvil y Tablet < 992px) */}
                {sesionActiva && menuBurgerAbierto && (
                    <div className="burger-dropdown-panel d-lg-none">
                        <nav className="burger-nav-list" aria-label="Menú Móvil">
                            {NAV_ITEMS.map((item) => {
                                const isActive = activeView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`burger-nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => handleSeleccionarVista(item.id)}
                                    >
                                        <span>{item.label}</span>
                                        {isActive && <span className="burger-active-dot">●</span>}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="d-flex align-items-center justify-content-between gap-2 pt-2 mt-2 border-top border-white/15">
                            <span className="text-xs text-slate-200">
                                Saldo disponible:{' '}
                                <strong className="text-[#00D9FF]">{formatMoney(saldoActual)}</strong>
                            </span>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-light text-xs fw-semibold rounded-pill px-3 py-1"
                                onClick={handleCerrarSesionClick}
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
