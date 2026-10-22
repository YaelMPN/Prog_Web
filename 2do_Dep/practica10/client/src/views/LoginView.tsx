/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: client/src/views/LoginView.tsx
 * Framework: React + TypeScript + Bootstrap 5 (Grid y Tarjetas .card-finanzas)
 * Rol Arquitectónico: Vista de Inicio de Sesión que valida credenciales contra
 * el backend (`POST /api/finanzas/auth/login`), sin datos prellenados demo,
 * con casilla "Recordar mis datos", enlace a "Crear cuenta" y Modal Emergente
 * de aviso con botón "Aceptar".
 * ============================================================================
 */

import React, { useState } from 'react';
import FrameworkBadge from '../components/FrameworkBadge';
import { AuthResponse } from '../services/finanzasApi';

interface LoginViewProps {
    onLogin: (email: string, password: string, recordar: boolean) => Promise<AuthResponse>;
    onGoToRegister: () => void;
}

export default function LoginView({ onLogin, onGoToRegister }: LoginViewProps) {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [recordar, setRecordar] = useState<boolean>(false);
    const [cargando, setCargando] = useState<boolean>(false);

    const [modalAviso, setModalAviso] = useState<{
        activo: boolean;
        titulo: string;
        mensaje: string;
        redirigirARegistro: boolean;
    }>({
        activo: false,
        titulo: 'Aviso',
        mensaje: '',
        redirigirARegistro: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailLimpio = email.trim();
        if (!emailLimpio || !emailLimpio.includes('@')) {
            setModalAviso({
                activo: true,
                titulo: 'Correo requerido',
                mensaje: 'Por favor ingresa una dirección de correo electrónico válida.',
                redirigirARegistro: false
            });
            return;
        }

        if (!password) {
            setModalAviso({
                activo: true,
                titulo: 'Contraseña requerida',
                mensaje: 'Ingresa tu contraseña para acceder a tu cuenta.',
                redirigirARegistro: false
            });
            return;
        }

        setCargando(true);
        try {
            const respuesta = await onLogin(emailLimpio, password, recordar);
            if (!respuesta || !respuesta.ok) {
                const noExiste = respuesta?.codigo === 'USUARIO_NO_ENCONTRADO';
                setModalAviso({
                    activo: true,
                    titulo: respuesta?.titulo || 'Cuenta no encontrada',
                    mensaje:
                        respuesta?.message ||
                        'No se encontró una cuenta con esos datos. Regístrate para crear tu cuenta.',
                    redirigirARegistro: noExiste
                });
            }
        } finally {
            setCargando(false);
        }
    };

    const handleAceptarModal = () => {
        const irARegistro = modalAviso.redirigirARegistro;
        setModalAviso((prev) => ({ ...prev, activo: false, redirigirARegistro: false }));
        if (irARegistro) {
            onGoToRegister();
        }
    };

    return (
        <main className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-sm-10 col-md-7 col-lg-5">
                    <section className="card-finanzas shadow-sm">
                        <div className="card-header-inst d-flex justify-content-between align-items-center">
                            <span>Iniciar Sesión</span>
                            <span className="badge-aqua">YaFinanzas</span>
                        </div>

                        <div className="p-4">
                            <div className="text-center mb-4">
                                <div
                                    className="minilogo-circle mx-auto mb-2"
                                    style={{ width: '52px', height: '52px', fontSize: '1.15rem' }}
                                >
                                    YF
                                </div>
                                <h1 className="h4 fw-bold text-[#3B5266] mb-1">Bienvenido</h1>
                                <p className="text-xs text-slate-500 mb-0">
                                    Ingresa tus credenciales para acceder a tu control de finanzas personales.
                                </p>
                            </div>

                            <form id="login-form" onSubmit={handleSubmit} noValidate autoComplete="off">
                                <div className="mb-3">
                                    <label
                                        htmlFor="login-email"
                                        className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                    >
                                        Correo Electrónico *
                                    </label>
                                    <input
                                        type="email"
                                        id="login-email"
                                        name="email"
                                        className="form-control form-control-finanzas"
                                        placeholder="correo@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="off"
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="login-password"
                                        className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                    >
                                        Contraseña *
                                    </label>
                                    <input
                                        type="password"
                                        id="login-password"
                                        name="password"
                                        className="form-control form-control-finanzas"
                                        placeholder="Ingresa tu contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>

                                {/* Casilla seleccionable: Recordar mis datos */}
                                <div className="mb-4 d-flex align-items-center justify-content-between">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            id="login-remember"
                                            className="form-check-input"
                                            checked={recordar}
                                            onChange={(e) => setRecordar(e.target.checked)}
                                        />
                                        <label
                                            htmlFor="login-remember"
                                            className="form-check-label text-xs text-slate-600 fw-semibold"
                                        >
                                            Recordar mis datos
                                        </label>
                                    </div>
                                </div>

                                <div className="d-grid mb-3">
                                    <button
                                        type="submit"
                                        id="btn-login-submit"
                                        className="btn-royal py-2.5"
                                        disabled={cargando}
                                    >
                                        {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                                    </button>
                                </div>

                                <div className="text-center pt-3 border-top border-[#CFD8DC]">
                                    <span className="text-xs text-slate-600">
                                        ¿No tienes una cuenta?{' '}
                                    </span>
                                    <button
                                        type="button"
                                        id="btn-ir-registro"
                                        className="btn btn-link btn-sm p-0 text-xs fw-bold text-[#1D4ED8] text-decoration-none"
                                        onClick={onGoToRegister}
                                    >
                                        Crear cuenta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    <FrameworkBadge />
                </div>
            </div>

            {/* Modal Emergente de Aviso con Botón Aceptar */}
            <div
                id="modalAvisoLogin"
                className={`modal-overlay ${modalAviso.activo ? 'activo' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloModalLogin"
            >
                <div className="modal-card">
                    <svg className="icono-prevencion" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                    <h2 id="tituloModalLogin" className="modal-titulo">
                        {modalAviso.titulo}
                    </h2>
                    <p className="modal-mensaje">{modalAviso.mensaje}</p>
                    <button
                        type="button"
                        id="btnAceptarModalLogin"
                        className="btn-modal"
                        onClick={handleAceptarModal}
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </main>
    );
}
