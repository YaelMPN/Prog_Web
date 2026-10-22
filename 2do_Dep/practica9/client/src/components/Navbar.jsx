/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/components/Navbar.jsx
 * Framework: React + TypeScript + Bootstrap 5 (Grid/Flexbox Responsivo)
 * Rol Arquitectónico: Barra de navegación superior con minilogo ("F" o imagen
 * de perfil editable mediante ícono de lápiz con vista previa local), menú
 * burbuja responsivo, saldo en tiempo real y campana de notificaciones.
 * ============================================================================
 */

import React, { useState, useRef } from 'react';
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
    const [avatarUrl, setAvatarUrl] = useState('');
    const [tempPreviewUrl, setTempPreviewUrl] = useState('');
    const [modalImagenAbierto, setModalImagenAbierto] = useState(false);
    const [estadoImagenTexto, setEstadoImagenTexto] = useState(
        'Selecciona una imagen desde tu dispositivo para ver la vista previa.'
    );
    const [alertaArchivo, setAlertaArchivo] = useState('');
    const fileInputRef = useRef(null);

    const handleAbrirModalImagen = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTempPreviewUrl(avatarUrl || '');
        setAlertaArchivo('');
        setEstadoImagenTexto(
            avatarUrl
                ? 'Imagen actual cargada. Puedes elegir otra imagen para cambiarla.'
                : 'Selecciona una imagen desde tu dispositivo para ver la vista previa.'
        );
        setModalImagenAbierto(true);
    };

    const handleSeleccionarArchivo = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setAlertaArchivo('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
            e.target.value = '';
            return;
        }

        setAlertaArchivo('');
        const reader = new FileReader();
        reader.onload = (ev) => {
            const resultUrl = String(ev.target?.result || '');
            setTempPreviewUrl(resultUrl);
            setEstadoImagenTexto(
                'Vista previa cargada. Presiona "Aceptar imagen" para colocarla como foto de perfil.'
            );
        };
        reader.readAsDataURL(file);
    };

    const handleAceptarImagen = () => {
        if (!tempPreviewUrl) {
            setAlertaArchivo('Primero selecciona una imagen desde tu dispositivo.');
            return;
        }
        setAvatarUrl(tempPreviewUrl);
        setModalImagenAbierto(false);
    };

    const handleRestablecerLogo = () => {
        setTempPreviewUrl('');
        setAvatarUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setModalImagenAbierto(false);
    };

    return (
        <>
            <header className="navbar-finanzas shadow-sm">
                <div className="container">
                    <div className="navbar-layout-row d-flex flex-wrap align-items-center justify-content-between gap-2">
                        {/* Marca Izquierda: Minilogo ("F" o Foto de Perfil) + Lapicito + Texto Finanzas */}
                        <div className="navbar-brand-wrapper">
                            <div className="minilogo-avatar-box">
                                <button
                                    type="button"
                                    className="minilogo-circle p-0"
                                    onClick={() => onSelectView('dashboard')}
                                    title="Ir al Dashboard"
                                >
                                    {avatarUrl ? (
                                        <img
                                            id="nav-user-avatar"
                                            src={avatarUrl}
                                            alt="Imagen de perfil"
                                            className="minilogo-img-perfil"
                                        />
                                    ) : (
                                        <span id="nav-user-initial">F</span>
                                    )}
                                </button>

                                {/* Botón de Lapicito para subir imagen local con vista previa */}
                                <button
                                    type="button"
                                    id="btnEditarImagenLogo"
                                    className="btn-lapiz-minilogo"
                                    onClick={handleAbrirModalImagen}
                                    title="Cambiar imagen de perfil"
                                    aria-label="Cambiar imagen de perfil"
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                                    </svg>
                                </button>
                            </div>

                            <a
                                href="#dashboard"
                                className="navbar-brand-title"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onSelectView('dashboard');
                                }}
                            >
                                <span>Finanzas</span>
                            </a>
                        </div>

                        {/* Menú Píldora / Burbuja Central (Responsivo) */}
                        <div className="navbar-menu-center mx-lg-auto">
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
                                                onSelectView(item.id);
                                            }}
                                        >
                                            {item.label}
                                        </a>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Área Derecha: Saldo Disponible y Campana de Notificaciones */}
                        <div className="d-flex align-items-center gap-2 ms-auto ms-lg-0">
                            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs text-nowrap">
                                <span className="text-slate-300">Saldo:</span>
                                <strong className="text-[#00D9FF] ms-1" data-nav-balance>
                                    {formatMoney(saldoActual)}
                                </strong>
                            </div>

                            <Notificaciones notifications={notifications} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Ventana Emergente para Cargar Imagen Local con Vista Previa */}
            <div
                id="modalImagenPerfil"
                className={`modal-overlay ${modalImagenAbierto ? 'activo' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloModalImagen"
            >
                <div className="modal-card">
                    <h2 id="tituloModalImagen" className="modal-titulo mb-1">
                        Imagen de Perfil
                    </h2>
                    <p className="text-xs text-slate-500 mb-3">
                        Selecciona una imagen local para personalizar el ícono de la barra superior.
                    </p>

                    <div className="mb-3 text-start">
                        <label
                            htmlFor="inputArchivoPerfil"
                            className="form-label text-xs fw-bold uppercase text-[#3B5266] mb-1"
                        >
                            Seleccionar archivo de imagen
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            id="inputArchivoPerfil"
                            accept="image/*"
                            className="form-control form-control-sm form-control-finanzas"
                            onChange={handleSeleccionarArchivo}
                        />
                    </div>

                    {/* Contenedor de Vista Previa */}
                    <div className="preview-container-box mb-3">
                        <span className="text-xs fw-bold uppercase text-slate-500 d-block mb-1">
                            Vista Previa
                        </span>
                        {tempPreviewUrl ? (
                            <img
                                id="imgVistaPrevia"
                                src={tempPreviewUrl}
                                alt="Vista previa de perfil"
                                className="image-preview-avatar"
                            />
                        ) : (
                            <div className="image-preview-placeholder">F</div>
                        )}
                        <p className="text-xs text-slate-600 mb-0 mt-1">{estadoImagenTexto}</p>
                        {alertaArchivo && (
                            <p className="text-xs fw-bold text-danger mb-0 mt-1">{alertaArchivo}</p>
                        )}
                    </div>

                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary fw-semibold flex-fill py-2"
                            onClick={() => setModalImagenAbierto(false)}
                        >
                            Cancelar
                        </button>
                        {avatarUrl && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger fw-semibold py-2 px-3"
                                onClick={handleRestablecerLogo}
                            >
                                Quitar
                            </button>
                        )}
                        <button
                            type="button"
                            id="btnAceptarImagen"
                            className="btn-royal btn-sm flex-fill py-2"
                            onClick={handleAceptarImagen}
                        >
                            Aceptar imagen
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
