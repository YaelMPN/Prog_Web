/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/vite.config.js
 * Framework Frontend: React + TypeScript + Vite
 * Rol Arquitectónico: Configura el servidor de desarrollo de React y el proxy
 * hacia el backend en ASP.NET Core Web API (http://localhost:5000).
 * ============================================================================
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    }
});

