/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: client/src/components/FrameworkBadge.jsx
 * Framework: React + TypeScript (Componente Funcional View) + Bootstrap 5
 * Rol Arquitectónico: Pie de página discreto en todas las vistas que indica
 * los frameworks utilizados en el Frontend, UI y Backend (.NET 8 + SQLite 3FN).
 * ============================================================================
 */

import React from 'react';

export default function FrameworkBadge() {
    return (
        <footer className="mt-4 pt-3 border-top border-[#CFD8DC] text-center">
            <p className="text-muted text-xs mb-0">
                Frontend: React + TypeScript | UI: Bootstrap 5 | Backend: ASP.NET Core + SQLite (3FN)
            </p>
        </footer>
    );
}
