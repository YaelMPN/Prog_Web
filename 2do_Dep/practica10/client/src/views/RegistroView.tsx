/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: client/src/views/RegistroView.tsx
 * Framework: React + TypeScript + Bootstrap 5 (Grid y Tarjetas .card-finanzas)
 * Rol Arquitectónico: Vista de Registro de Usuario que captura identidad y
 * presupuesto inicial, con carga de archivo local de Imagen de Perfil con
 * vista previa circular y botón de confirmación, así como casilla y Modal
 * Emergente de Aviso de Privacidad.
 * ============================================================================
 */

import React, { useState, useRef } from 'react';
import FrameworkBadge from '../components/FrameworkBadge';
import { AuthResponse, RegistroUsuarioDTO } from '../services/finanzasApi';

interface RegistroViewProps {
    onRegister: (payload: RegistroUsuarioDTO) => Promise<AuthResponse>;
    onGoToLogin: () => void;
}

export default function RegistroView({ onRegister, onGoToLogin }: RegistroViewProps) {
    const [nombre, setNombre] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [saldoInicial, setSaldoInicial] = useState<string>('0');
    const [limiteMensual, setLimiteMensual] = useState<string>('0');
    const [password, setPassword] = useState<string>('');
    const [confirmarPassword, setConfirmarPassword] = useState<string>('');
    const [aceptaPrivacidad, setAceptaPrivacidad] = useState<boolean>(false);

    // Estado para la carga de imagen local con vista previa circular y botón de confirmación
    const [tempPreviewUrl, setTempPreviewUrl] = useState<string>('');
    const [avatarConfirmadoUrl, setAvatarConfirmadoUrl] = useState<string>('');
    const [imagenConfirmada, setImagenConfirmada] = useState<boolean>(false);
    const [estadoImagenTexto, setEstadoImagenTexto] = useState<string>(
        'Selecciona una imagen desde tu dispositivo para ver cómo lucirá en tu perfil.'
    );
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [cargando, setCargando] = useState<boolean>(false);
    const [modalPrivacidadAbierto, setModalPrivacidadAbierto] = useState<boolean>(false);
    const [modalAviso, setModalAviso] = useState<{
        activo: boolean;
        esExito: boolean;
        titulo: string;
        mensaje: string;
    }>({
        activo: false,
        esExito: false,
        titulo: 'Aviso',
        mensaje: ''
    });

    const inicialNombre = nombre.trim() ? nombre.trim().charAt(0).toUpperCase() : 'U';

    const handleSeleccionarImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setModalAviso({
                activo: true,
                esExito: false,
                titulo: 'Formato no válido',
                mensaje: 'Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).'
            });
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = String(ev.target?.result || '');
            setTempPreviewUrl(dataUrl);
            setImagenConfirmada(false);
            setEstadoImagenTexto(
                'Vista previa lista. Presiona "Aceptar imagen" para confirmar tu foto de perfil.'
            );
        };
        reader.readAsDataURL(file);
    };

    const handleAceptarImagen = () => {
        if (!tempPreviewUrl) {
            setModalAviso({
                activo: true,
                esExito: false,
                titulo: 'Sin imagen seleccionada',
                mensaje: 'Primero selecciona un archivo de imagen desde tu dispositivo.'
            });
            return;
        }
        setAvatarConfirmadoUrl(tempPreviewUrl);
        setImagenConfirmada(true);
        setEstadoImagenTexto('✓ Imagen de perfil confirmada para tu cuenta.');
    };

    const handleQuitarImagen = () => {
        setTempPreviewUrl('');
        setAvatarConfirmadoUrl('');
        setImagenConfirmada(false);
        setEstadoImagenTexto(
            'Selecciona una imagen desde tu dispositivo para ver cómo lucirá en tu perfil.'
        );
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (nombre.trim().length < 2) {
            setModalAviso({
                activo: true,
                esExito: false,
                titulo: 'Nombre requerido',
                mensaje: 'Ingresa tu nombre completo (mínimo 2 caracteres).'
            });
            return;
        }

        const emailLimpio = email.trim();
        if (!emailLimpio || !emailLimpio.includes('@')) {
            setModalAviso({
                activo: true,
                esExito: false,
                titulo: 'Correo inválido',
                mensaje: 'Ingresa una dirección de correo electrónico válida.'
            });
            return;
        }

        const numSaldo = parseFloat(saldoInicial === '' ? '0' : saldoInicial);
        if (isNaN(numSaldo) || numSaldo < 0) {
            setModalAviso({
                activo: true,
                esExito: false,
                titulo: 'Saldo inicial inválido',
                mensaje: 'El saldo inicial debe ser $0.00 o una cantidad mayor o igual a cero.'
            });
            return;
        }

        const numLimite = parseFloat(limiteMensual === '' ? '0' : limiteMensual);
        if (isNaN(numLimite) || numLimite < 0) {
            setModalAviso({
                activo: true,
                esExito: false,
                titulo: 'Límite mensual inválido',
                mensaje: 'El límite mensual debe ser $0.00 o una cantidad positiva.'
            });
            return;
        }

        if (password.length < 4) {
            setModalAviso({
                activo: true,
                esExito: false,
                titulo: 'Contraseña muy corta',
                mensaje: 'La contraseña debe tener al menos 4 caracteres.'
            });
            return;
        }

        if (password !== confirmarPassword) {
            setModalAviso({
                activo: true,
                esExito: false,
                titulo: 'Las contraseñas no coinciden',
                mensaje: 'Verifica que la contraseña y su confirmación sean idénticas.'
            });
            return;
        }

        if (!aceptaPrivacidad) {
            setModalAviso({
                activo: true,
                esExito: false,
                titulo: 'Aviso de privacidad',
                mensaje: 'Debes aceptar el aviso de privacidad para crear tu cuenta.'
            });
            return;
        }

        setCargando(true);
        try {
            const avatarFinal = avatarConfirmadoUrl || tempPreviewUrl || '';
            const respuesta = await onRegister({
                nombre: nombre.trim(),
                email: emailLimpio,
                password,
                saldoInicial: numSaldo,
                limiteMensual: numLimite,
                avatarDataUrl: avatarFinal
            });

            if (!respuesta || !respuesta.ok) {
                setModalAviso({
                    activo: true,
                    esExito: false,
                    titulo: respuesta?.titulo || 'No se pudo crear la cuenta',
                    mensaje:
                        respuesta?.message ||
                        'Ocurrió un inconveniente al registrar tu cuenta. Intenta nuevamente.'
                });
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <main className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-10 col-lg-8">
                    <section className="card-finanzas shadow-sm">
                        <div className="card-header-inst d-flex justify-content-between align-items-center">
                            <span>Crear Cuenta</span>
                            <span className="badge-aqua">Nuevo Usuario</span>
                        </div>

                        <div className="p-4">
                            <form id="registro-form" onSubmit={handleSubmit} noValidate autoComplete="off">
                                <div className="row g-3 mb-3">
                                    {/* Nombre Completo */}
                                    <div className="col-12 col-md-6">
                                        <label
                                            htmlFor="reg-nombre"
                                            className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                        >
                                            Nombre Completo *
                                        </label>
                                        <input
                                            type="text"
                                            id="reg-nombre"
                                            className="form-control form-control-finanzas"
                                            placeholder="Ej. Ana García López"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Correo Electrónico */}
                                    <div className="col-12 col-md-6">
                                        <label
                                            htmlFor="reg-email"
                                            className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                        >
                                            Correo Electrónico *
                                        </label>
                                        <input
                                            type="email"
                                            id="reg-email"
                                            className="form-control form-control-finanzas"
                                            placeholder="correo@ejemplo.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Saldo Inicial y Límite Mensual */}
                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-sm-6">
                                        <label
                                            htmlFor="reg-saldo-inicial"
                                            className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                        >
                                            Saldo Inicial ($) * (Acepta 0 o mayor)
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-[#F4F6F8] border-[#CFD8DC] fw-bold text-[#3B5266]">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                id="reg-saldo-inicial"
                                                step="0.01"
                                                min="0"
                                                className="form-control form-control-finanzas"
                                                placeholder="0.00"
                                                value={saldoInicial}
                                                onChange={(e) => setSaldoInicial(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-12 col-sm-6">
                                        <label
                                            htmlFor="reg-limite-mensual"
                                            className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                        >
                                            Límite de Gasto Mensual ($) (Opcional)
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-[#F4F6F8] border-[#CFD8DC] fw-bold text-[#3B5266]">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                id="reg-limite-mensual"
                                                step="0.01"
                                                min="0"
                                                className="form-control form-control-finanzas"
                                                placeholder="0.00"
                                                value={limiteMensual}
                                                onChange={(e) => setLimiteMensual(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contraseña y Confirmar Contraseña */}
                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-sm-6">
                                        <label
                                            htmlFor="reg-password"
                                            className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                        >
                                            Contraseña *
                                        </label>
                                        <input
                                            type="password"
                                            id="reg-password"
                                            className="form-control form-control-finanzas"
                                            placeholder="Mínimo 4 caracteres"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-sm-6">
                                        <label
                                            htmlFor="reg-confirm-password"
                                            className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                        >
                                            Confirmar Contraseña *
                                        </label>
                                        <input
                                            type="password"
                                            id="reg-confirm-password"
                                            className="form-control form-control-finanzas"
                                            placeholder="Repite tu contraseña"
                                            value={confirmarPassword}
                                            onChange={(e) => setConfirmarPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Carga de Archivo Local para Imagen de Perfil con Vista Previa Circular */}
                                <div className="mb-3 p-3 rounded border border-[#CFD8DC] bg-[#F8FAFC]">
                                    <div className="row g-3 align-items-center">
                                        <div className="col-12 col-md-7">
                                            <label
                                                htmlFor="reg-avatar-input"
                                                className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                                            >
                                                Imagen de Perfil (Opcional)
                                            </label>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                id="reg-avatar-input"
                                                accept="image/*"
                                                className="form-control form-control-sm form-control-finanzas mb-2"
                                                onChange={handleSeleccionarImagen}
                                            />
                                            <div className="d-flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    id="btn-aceptar-imagen-registro"
                                                    className="btn btn-sm btn-inst py-1 px-3 text-xs"
                                                    onClick={handleAceptarImagen}
                                                >
                                                    {imagenConfirmada ? '✓ Imagen Aceptada' : 'Aceptar imagen'}
                                                </button>
                                                {tempPreviewUrl && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary py-1 px-3 text-xs"
                                                        onClick={handleQuitarImagen}
                                                    >
                                                        Quitar imagen
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-5">
                                            <div className="preview-container-box py-2 px-3">
                                                <span className="text-xs fw-bold uppercase text-slate-500 d-block">
                                                    Vista Previa Circular
                                                </span>
                                                {tempPreviewUrl ? (
                                                    <img
                                                        id="reg-avatar-preview"
                                                        src={tempPreviewUrl}
                                                        alt="Vista previa de perfil"
                                                        className="image-preview-avatar"
                                                    />
                                                ) : (
                                                    <div className="image-preview-placeholder">
                                                        {inicialNombre}
                                                    </div>
                                                )}
                                                <p
                                                    className={`text-xs mb-0 mt-1 ${
                                                        imagenConfirmada
                                                            ? 'text-success fw-bold'
                                                            : 'text-slate-600'
                                                    }`}
                                                >
                                                    {estadoImagenTexto}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Casilla de Aviso de Privacidad + Botón para abrir Modal de Privacidad */}
                                <div className="mb-4 p-3 rounded border border-[#CFD8DC] bg-white d-flex flex-wrap align-items-center justify-content-between gap-2">
                                    <div className="form-check mb-0">
                                        <input
                                            type="checkbox"
                                            id="reg-privacidad"
                                            className="form-check-input"
                                            checked={aceptaPrivacidad}
                                            onChange={(e) => setAceptaPrivacidad(e.target.checked)}
                                        />
                                        <label
                                            htmlFor="reg-privacidad"
                                            className="form-check-label text-xs fw-semibold text-[#2D3748]"
                                        >
                                            Acepto el aviso de privacidad y el uso de mis datos financieros *
                                        </label>
                                    </div>
                                    <button
                                        type="button"
                                        id="btn-ver-privacidad"
                                        className="btn btn-sm btn-outline-primary text-xs fw-semibold py-1 px-2.5"
                                        onClick={() => setModalPrivacidadAbierto(true)}
                                    >
                                        Ver aviso de privacidad
                                    </button>
                                </div>

                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-3 border-top border-[#CFD8DC]">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary fw-semibold text-sm"
                                        onClick={onGoToLogin}
                                    >
                                        ← Volver a Iniciar Sesión
                                    </button>

                                    <button
                                        type="submit"
                                        id="btn-crear-cuenta"
                                        className="btn-royal"
                                        disabled={cargando}
                                    >
                                        {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    <FrameworkBadge />
                </div>
            </div>

            {/* Modal Emergente del Aviso de Privacidad */}
            <div
                id="modalAvisoPrivacidad"
                className={`modal-overlay ${modalPrivacidadAbierto ? 'activo' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloModalPrivacidad"
            >
                <div className="modal-card modal-card-privacidad">
                    <h2 id="tituloModalPrivacidad" className="modal-titulo mb-2">
                        Aviso de Privacidad y Protección de Datos
                    </h2>
                    <div className="aviso-privacidad-box">
                        <p className="mb-2">
                            <strong>1. Resguardo de Información:</strong> Tus datos de perfil,
                            configuración de presupuesto, movimientos y metas de ahorro se resguardan
                            de forma segura y privada para tu cuenta personal.
                        </p>
                        <p className="mb-2">
                            <strong>2. Finalidad del Tratamiento:</strong> La información capturada se
                            utiliza exclusivamente para el cálculo de tu saldo disponible, generación de
                            reportes de ingresos/egresos y simulaciones de metas de ahorro.
                        </p>
                        <p className="mb-0">
                            <strong>3. Confidencialidad:</strong> Tu imagen de perfil y registros
                            financieros permanecen asociados únicamente a tu cuenta dentro de
                            YaFinanzas y no se comparten con terceros.
                        </p>
                    </div>
                    <div className="d-flex gap-2 justify-content-end">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm fw-semibold px-3"
                            onClick={() => setModalPrivacidadAbierto(false)}
                        >
                            Cerrar
                        </button>
                        <button
                            type="button"
                            className="btn-royal btn-sm px-3"
                            onClick={() => {
                                setAceptaPrivacidad(true);
                                setModalPrivacidadAbierto(false);
                            }}
                        >
                            Aceptar Aviso de Privacidad
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Emergente de Validación / Confirmación */}
            <div
                id="modalAvisoRegistro"
                className={`modal-overlay ${modalAviso.activo ? 'activo' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloModalRegistro"
            >
                <div className="modal-card">
                    <svg className="icono-prevencion" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                    <h2 id="tituloModalRegistro" className="modal-titulo">
                        {modalAviso.titulo}
                    </h2>
                    <p className="modal-mensaje">{modalAviso.mensaje}</p>
                    <button
                        type="button"
                        className="btn-modal"
                        onClick={() => setModalAviso({ ...modalAviso, activo: false })}
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </main>
    );
}
