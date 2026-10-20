/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/main.jsx
 * Framework: React 18 (Punto de Entrada de la Capa View - MVC)
 * Rol Arquitectónico: Inicializa el árbol de componentes de React en #root
 * e importa la hoja de estilos institucional (styles.css).
 * ============================================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

