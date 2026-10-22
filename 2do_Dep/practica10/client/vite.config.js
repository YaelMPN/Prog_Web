/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: client/vite.config.js
 * Framework Frontend: React + TypeScript + Vite
 * Rol Arquitectónico: Configura el servidor de desarrollo de React con
 * `host: true` para permitir visualización tanto en PC como en dispositivos
 * móviles por red local (Wi-Fi) o cable USB, y proxy hacia ASP.NET Core (puerto 5000).
 * ============================================================================
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    }
});
