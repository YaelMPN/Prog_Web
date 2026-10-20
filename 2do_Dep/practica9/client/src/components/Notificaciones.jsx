/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/components/Notificaciones.jsx
 * Framework: React + TypeScript + Bootstrap 5
 * Rol Arquitectónico: Componente de vista que gestiona el menú desplegable de
 * notificaciones en tiempo real sincronizado con el servidor ASP.NET Core (.NET).
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';

export default function Notificaciones({ notifications = [] }) {
    const [abierto, setAbierto] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setAbierto(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="contenedor-notificaciones" ref={containerRef}>
            <button
                type="button"
                id="btnCampana"
                className="btn-campana"
                aria-label="Notificaciones"
                onClick={(e) => {
                    e.stopPropagation();
                    setAbierto((prev) => !prev);
                }}
            >
                <svg className="icono-campana" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                <span id="contadorNotificaciones" className="contador-notificaciones">
                    {notifications.length}
                </span>
            </button>

            <ul
                id="listaNotificaciones"
                className={`menu-notificaciones ${abierto ? 'abierto' : ''}`}
            >
                {notifications.length === 0 ? (
                    <li className="vacio">Sin notificaciones</li>
                ) : (
                    <>
                        <li className="menu-notificaciones-header">
                            <span>Notificaciones</span>
                            <span className="badge-aqua">{notifications.length}</span>
                        </li>
                        {notifications.map((n) => (
                            <li key={n.id} className="item-notificacion">
                                <div className="fw-semibold text-[#3B5266]">{n.texto}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">{n.hora}</div>
                            </li>
                        ))}
                    </>
                )}
            </ul>
        </div>
    );
}

