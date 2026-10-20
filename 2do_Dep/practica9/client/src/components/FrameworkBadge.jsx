/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/components/FrameworkBadge.jsx
 * Framework: React + TypeScript (Componente Funcional View) + Bootstrap 5
 * Rol Arquitectónico: Pie de página discreto en todas las vistas que indica
 * los frameworks utilizados en el Frontend, Layout y Backend (.NET).
 * ============================================================================
 */

import React from 'react';

export default function FrameworkBadge() {
    return (
        <footer className="mt-4 pt-3 border-top border-[#CFD8DC] text-center">
            <p className="text-muted text-xs mb-0">
                Frontend: React + TypeScript | Layout: Bootstrap 5 | Backend: ASP.NET Core (.NET)
            </p>
        </footer>
    );
}
