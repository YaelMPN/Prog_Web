/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: js/controllers.js
 * Capas Arquitectónicas: VIEW (`FinanceView`) y CONTROLLER (`FinanceController`)
 * ============================================================================
 */

(function (global) {
    'use strict';

    const { Category } = global.FinanceMVC.Models;
    const memoryState = global.FinanceMVC.Models.memoryState;

    /**
     * ========================================================================
     * CAPA VIEW: FinanceView
     * ========================================================================
     */
    class FinanceView {
        static formatMoney(value) {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 2
            }).format(Number(value || 0));
        }

        /**
         * Actualiza los datos visibles en la Navbar (solo cuando el usuario ha iniciado sesión).
         */
        static renderNavbarStatus(balance, user, notifications = []) {
            const navAuthArea = document.getElementById('navbar-authenticated-area');
            if (!user || !user.autenticado) {
                if (navAuthArea) navAuthArea.classList.add('d-none');
                return;
            }

            if (navAuthArea) navAuthArea.classList.remove('d-none');

            const navBalanceEls = document.querySelectorAll('[data-nav-balance]');
            navBalanceEls.forEach(el => {
                el.textContent = FinanceView.formatMoney(balance.saldoActual);
            });

            const navUserEls = document.querySelectorAll('[data-nav-user]');
            navUserEls.forEach(el => {
                el.textContent = user.nombre || 'Usuario';
            });

            const avatarImg = document.getElementById('nav-user-avatar');
            const avatarFallback = document.getElementById('nav-user-initial');
            if (avatarImg && avatarFallback) {
                if (user.avatarDataUrl) {
                    avatarImg.src = user.avatarDataUrl;
                    avatarImg.classList.remove('d-none');
                    avatarFallback.classList.add('d-none');
                } else {
                    avatarImg.classList.add('d-none');
                    avatarFallback.classList.remove('d-none');
                    avatarFallback.textContent = (user.nombre || 'U').charAt(0).toUpperCase();
                }
            }

            const contadorEl = document.getElementById('contadorNotificaciones');
            const listaEl = document.getElementById('listaNotificaciones');

            if (contadorEl) {
                contadorEl.textContent = String(notifications.length);
            }

            if (listaEl) {
                if (notifications.length === 0) {
                    listaEl.innerHTML = `<li class="vacio">Sin notificaciones</li>`;
                } else {
                    const itemsHTML = notifications.map(n => `
                        <li class="item-notificacion">
                            <div class="fw-semibold text-[#3B5266]">${FinanceView.escapeHTML(n.texto)}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">${FinanceView.escapeHTML(n.hora)}</div>
                        </li>
                    `).join('');
                    listaEl.innerHTML = `
                        <li class="menu-notificaciones-header">
                            <span>Notificaciones</span>
                            <span class="badge-aqua">${notifications.length}</span>
                        </li>
                        ${itemsHTML}
                    `;
                }
            }
        }

        /**
         * Renderiza las métricas y tablas del Dashboard Principal.
         */
        static renderDashboard(balance, transactions, report) {
            const setText = (id, text) => {
                const el = document.getElementById(id);
                if (el) el.textContent = text;
            };

            setText('dash-saldo-actual', FinanceView.formatMoney(balance.saldoActual));
            setText('dash-saldo-base', FinanceView.formatMoney(balance.saldoBase));
            setText('dash-total-ingresos', FinanceView.formatMoney(balance.totalIngresos));
            setText('dash-total-egresos', FinanceView.formatMoney(balance.totalEgresos));
            setText('dash-balance-neto', (balance.balanceNetoMes >= 0 ? '+' : '') + FinanceView.formatMoney(balance.balanceNetoMes));
            setText('dash-count-ingresos', `${balance.conteoIngresos} mov.`);
            setText('dash-count-egresos', `${balance.conteoEgresos} mov.`);

            const barIngresos = document.getElementById('dash-bar-ingresos');
            const barEgresos = document.getElementById('dash-bar-egresos');
            if (barIngresos && barEgresos) {
                barIngresos.style.width = `${balance.porcentajeIngresos}%`;
                barEgresos.style.width = `${balance.porcentajeEgresos}%`;
                setText('dash-pct-ingresos', `${balance.porcentajeIngresos}% Ingresos`);
                setText('dash-pct-egresos', `${balance.porcentajeEgresos}% Egresos`);
            }

            // Desglose por categorías (muestra las categorías con movimientos o las 6 principales por defecto)
            const catContainer = document.getElementById('dash-category-breakdown');
            if (catContainer && report) {
                const conActividad = report.desgloseCategorias.filter(c => c.cantidad > 0);
                const listaMostrar = conActividad.length > 0
                    ? conActividad
                    : report.desgloseCategorias.slice(0, 6);

                catContainer.innerHTML = listaMostrar.map(item => {
                    const montoNeto = item.totalIngresos > 0 ? item.totalIngresos : item.totalEgresos;
                    const esIngreso = item.totalIngresos >= item.totalEgresos && item.totalIngresos > 0;
                    const badgeClass = item.cantidad === 0
                        ? 'bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs fw-semibold'
                        : (esIngreso ? 'badge-income' : 'badge-expense');
                    return `
                        <div class="col-6 col-md-4">
                            <div class="p-3 rounded border border-[#CFD8DC] bg-[#F8FAFC] flex flex-col justify-between h-100">
                                <div class="flex items-center justify-between mb-1 gap-1">
                                    <span class="font-semibold text-xs text-[#3B5266] text-truncate">${item.categoria}</span>
                                    <span class="${badgeClass} text-nowrap">${item.cantidad} mov.</span>
                                </div>
                                <div class="text-base font-bold text-[#2D3748]">
                                    ${FinanceView.formatMoney(montoNeto)}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Tabla de últimos movimientos
            const recentBody = document.getElementById('dash-recent-table-body');
            if (recentBody) {
                const recents = transactions.slice(0, 5);
                if (recents.length === 0) {
                    recentBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted">
                                Aún no has registrado movimientos. Usa el botón "+ Registrar Movimiento" para comenzar.
                            </td>
                        </tr>
                    `;
                } else {
                    recentBody.innerHTML = recents.map(tx => {
                        const esIngreso = tx.tipo === 'Ingreso';
                        return `
                            <tr>
                                <td class="text-nowrap font-mono text-xs text-slate-600">${tx.fecha}</td>
                                <td>
                                    <span class="${esIngreso ? 'badge-income' : 'badge-expense'}">
                                        ${esIngreso ? '▲ Ingreso' : '▼ Egreso'}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge-aqua">${tx.categoria}</span>
                                </td>
                                <td class="text-sm text-[#2D3748]">${FinanceView.escapeHTML(tx.descripcion)}</td>
                                <td class="text-end fw-bold ${esIngreso ? 'text-success' : 'text-danger'}">
                                    ${esIngreso ? '+' : '-'}${FinanceView.formatMoney(tx.monto)}
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        }

        /**
         * Renderiza el resumen lateral en la pantalla de Movimientos.
         */
        static renderMovimientosSidebar(balance, transactions) {
            const liveSaldoEl = document.getElementById('movimientos-live-balance');
            const liveIngresosEl = document.getElementById('movimientos-live-ingresos');
            const liveEgresosEl = document.getElementById('movimientos-live-egresos');

            if (liveSaldoEl) liveSaldoEl.textContent = FinanceView.formatMoney(balance.saldoActual);
            if (liveIngresosEl) liveIngresosEl.textContent = FinanceView.formatMoney(balance.totalIngresos);
            if (liveEgresosEl) liveEgresosEl.textContent = FinanceView.formatMoney(balance.totalEgresos);

            const listContainer = document.getElementById('movimientos-session-list');
            if (!listContainer) return;

            const recent = transactions.slice(0, 6);
            if (recent.length === 0) {
                listContainer.innerHTML = `
                    <div class="text-center py-4 text-slate-500 text-sm">
                        Sin movimientos registrados todavía.
                    </div>
                `;
                return;
            }

            listContainer.innerHTML = recent.map(tx => {
                const esIngreso = tx.tipo === 'Ingreso';
                return `
                    <div class="p-3 rounded border border-[#CFD8DC] bg-white flex items-center justify-between gap-2">
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="${esIngreso ? 'badge-income' : 'badge-expense'}">${tx.tipo}</span>
                                <span class="badge-aqua">${tx.categoria}</span>
                                <span class="text-xs text-slate-500 font-mono">${tx.fecha}</span>
                            </div>
                            <p class="mb-0 text-sm font-medium text-[#2D3748] text-truncate">${FinanceView.escapeHTML(tx.descripcion)}</p>
                        </div>
                        <div class="text-end fw-bold text-nowrap ${esIngreso ? 'text-success' : 'text-danger'}">
                            ${esIngreso ? '+' : '-'}${FinanceView.formatMoney(tx.monto)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        /**
         * Renderiza la tabla y el balance comparativo en Reportes.
         */
        static renderReportes(report, fullBalance) {
            const setText = (id, text) => {
                const el = document.getElementById(id);
                if (el) el.textContent = text;
            };

            const { balance, transacciones } = report;

            setText('rep-total-ingresos', FinanceView.formatMoney(balance.totalIngresos));
            setText('rep-total-egresos', FinanceView.formatMoney(balance.totalEgresos));
            setText('rep-balance-neto', (balance.balanceNetoMes >= 0 ? '+' : '') + FinanceView.formatMoney(balance.balanceNetoMes));
            setText('rep-saldo-final', FinanceView.formatMoney(fullBalance.saldoActual));
            setText('rep-conteo-filtrado', `${transacciones.length} movimientos`);

            const compBarIng = document.getElementById('comp-bar-ingresos');
            const compBarEgr = document.getElementById('comp-bar-egresos');
            if (compBarIng && compBarEgr) {
                compBarIng.style.width = `${balance.porcentajeIngresos}%`;
                compBarEgr.style.width = `${balance.porcentajeEgresos}%`;
                setText('comp-label-ingresos', `Ingresos (${balance.porcentajeIngresos}%)`);
                setText('comp-label-egresos', `Gastos / Egresos (${balance.porcentajeEgresos}%)`);
            }

            const tbody = document.getElementById('reportes-table-body');
            if (tbody) {
                if (transacciones.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center py-4 text-slate-500">
                                No hay movimientos registrados para mostrar.
                            </td>
                        </tr>
                    `;
                } else {
                    tbody.innerHTML = transacciones.map(tx => {
                        const esIngreso = tx.tipo === 'Ingreso';
                        return `
                            <tr>
                                <td class="font-mono text-xs text-slate-500">${tx.id}</td>
                                <td class="text-nowrap font-mono text-xs">${tx.fecha}</td>
                                <td>
                                    <span class="${esIngreso ? 'badge-income' : 'badge-expense'}">
                                        ${esIngreso ? '▲ Ingreso' : '▼ Egreso'}
                                    </span>
                                </td>
                                <td><span class="badge-aqua">${tx.categoria}</span></td>
                                <td class="text-sm text-[#2D3748]">${FinanceView.escapeHTML(tx.descripcion)}</td>
                                <td class="text-end fw-bold text-nowrap ${esIngreso ? 'text-success' : 'text-danger'}">
                                    ${esIngreso ? '+' : '-'}${FinanceView.formatMoney(tx.monto)}
                                </td>
                                <td class="text-center">
                                    <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" data-delete-tx="${tx.id}" title="Eliminar movimiento">
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        }

        static escapeHTML(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    }

    /**
     * ========================================================================
     * CAPA CONTROLLER: FinanceController
     * ========================================================================
     */
    class FinanceController {
        constructor() {
            this.activeFilters = {
                tipo: 'TODOS',
                categoria: 'TODAS',
                busqueda: ''
            };
        }

        init() {
            const path = global.location.pathname;
            const currentFile = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
            const isPublicScreen = currentFile === 'login.html' || currentFile === 'registro.html';

            if (!isPublicScreen && !memoryState.isAuthenticated()) {
                global.location.replace('login.html');
                return;
            }

            this.highlightActiveNavBubble(currentFile);
            this.refreshGlobalStatus();
            this.bindGlobalNavbarEvents();
            this.bindModalEvents();

            this.initLoginScreen();
            this.initRegistroScreen();
            this.initDashboardScreen();
            this.initMovimientosScreen();
            this.initReportesScreen();
        }

        highlightActiveNavBubble(currentFile) {
            const navLinks = document.querySelectorAll('.bubble-nav-link');
            navLinks.forEach(link => {
                const href = link.getAttribute('href') || '';
                if (href === currentFile) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.classList.remove('active');
                    link.removeAttribute('aria-current');
                }
            });
        }

        refreshGlobalStatus() {
            const balance = memoryState.getBalance();
            const user = memoryState.getUser();
            const notifications = memoryState.getNotifications();
            FinanceView.renderNavbarStatus(balance, user, notifications);
        }

        bindGlobalNavbarEvents() {
            const btnCampana = document.getElementById('btnCampana');
            const listaNotif = document.getElementById('listaNotificaciones');

            if (btnCampana && listaNotif) {
                btnCampana.addEventListener('click', (e) => {
                    e.stopPropagation();
                    listaNotif.classList.toggle('abierto');
                });

                document.addEventListener('click', (e) => {
                    if (!listaNotif.contains(e.target) && e.target !== btnCampana) {
                        listaNotif.classList.remove('abierto');
                    }
                });
            }

            const logoutBtn = document.getElementById('btn-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    memoryState.logout();
                    global.location.href = 'login.html';
                });
            }
        }

        bindModalEvents() {
            const modal = document.getElementById('modalEmergente');
            const closeBtn = document.getElementById('btnCerrarModal');

            if (modal && closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('activo');
                    if (typeof this._onModalCloseCallback === 'function') {
                        const cb = this._onModalCloseCallback;
                        this._onModalCloseCallback = null;
                        cb();
                    }
                });
            }
        }

        showModal(mensaje, titulo = 'Aviso', onClose = null) {
            const modal = document.getElementById('modalEmergente');
            const msgEl = document.getElementById('modalMensajeTexto');
            const titleEl = document.getElementById('modalTituloTexto');

            if (titleEl) titleEl.textContent = titulo;
            if (msgEl) msgEl.textContent = mensaje;
            this._onModalCloseCallback = onClose;

            if (modal) {
                modal.classList.add('activo');
            } else {
                alert(mensaje);
                if (typeof onClose === 'function') onClose();
            }
        }

        /**
         * --------------------------------------------------------------------
         * PANTALLA 1: LOGIN - login.html
         * --------------------------------------------------------------------
         */
        initLoginScreen() {
            const loginForm = document.getElementById('login-form');
            if (!loginForm) return;

            const emailInput = document.getElementById('login-email');
            const passInput = document.getElementById('login-password');
            const linkCrearCuenta = document.getElementById('link-crear-cuenta');

            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = (emailInput?.value || '').trim();
                const password = passInput?.value || '';

                if (!email || !password) {
                    this.showModal('Por favor ingresa tu correo electrónico y tu contraseña.', 'Campos requeridos');
                    return;
                }

                const resultado = memoryState.loginAccount(email, password);
                if (!resultado.ok) {
                    this.showModal(resultado.message, 'Cuenta no encontrada', () => {
                        if (resultado.reason === 'NO_EXISTE' && linkCrearCuenta) {
                            linkCrearCuenta.focus();
                        }
                    });
                    return;
                }

                global.location.href = 'index.html';
            });
        }

        /**
         * --------------------------------------------------------------------
         * PANTALLA 2: REGISTRO DE USUARIO - registro.html
         * Incluye Saldo Inicial, Carga de Imagen con Vista Previa y Modal de Aviso de Privacidad.
         * --------------------------------------------------------------------
         */
        initRegistroScreen() {
            const registroForm = document.getElementById('registro-form');
            if (!registroForm) return;

            const nombreInput = document.getElementById('reg-nombre');
            const emailInput = document.getElementById('reg-email');
            const saldoInput = document.getElementById('reg-saldo-inicial');
            const passInput = document.getElementById('reg-password');
            const confirmInput = document.getElementById('reg-confirm-password');
            const checkPrivacidad = document.getElementById('checkPrivacidad');

            // Ventana emergente para ver el Aviso de Privacidad
            const btnVerAviso = document.getElementById('btnVerAvisoPrivacidad');
            const modalPrivacidad = document.getElementById('modalAvisoPrivacidad');
            const btnAceptarAviso = document.getElementById('btnAceptarAvisoModal');
            const btnCerrarAviso = document.getElementById('btnCerrarAvisoModal');

            if (btnVerAviso && modalPrivacidad) {
                btnVerAviso.addEventListener('click', (e) => {
                    e.preventDefault();
                    modalPrivacidad.classList.add('activo');
                });
            }

            if (btnAceptarAviso && modalPrivacidad) {
                btnAceptarAviso.addEventListener('click', () => {
                    if (checkPrivacidad) checkPrivacidad.checked = true;
                    modalPrivacidad.classList.remove('activo');
                });
            }

            if (btnCerrarAviso && modalPrivacidad) {
                btnCerrarAviso.addEventListener('click', () => {
                    modalPrivacidad.classList.remove('activo');
                });
            }

            // Carga local de imagen de perfil y vista previa
            const fileInput = document.getElementById('reg-imagen-input');
            const imgPreview = document.getElementById('imgVistaPrevia');
            const previewPlaceholder = document.getElementById('previewPlaceholder');
            const btnAceptarImagen = document.getElementById('btnAceptarImagen');
            const estadoImagenTexto = document.getElementById('estadoImagenTexto');

            let tempImageDataUrl = '';
            let confirmedImageDataUrl = '';

            if (fileInput) {
                fileInput.addEventListener('change', () => {
                    const file = fileInput.files && fileInput.files[0];
                    if (!file) return;

                    if (!file.type.startsWith('image/')) {
                        this.showModal('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).', 'Formato no válido');
                        fileInput.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        tempImageDataUrl = String(ev.target?.result || '');
                        if (imgPreview) {
                            imgPreview.src = tempImageDataUrl;
                            imgPreview.style.display = 'block';
                        }
                        if (previewPlaceholder) {
                            previewPlaceholder.classList.add('d-none');
                        }
                        if (btnAceptarImagen) {
                            btnAceptarImagen.disabled = false;
                        }
                        if (estadoImagenTexto) {
                            estadoImagenTexto.textContent = 'Vista previa cargada. Presiona "Aceptar imagen" para confirmarla.';
                            estadoImagenTexto.className = 'text-xs text-slate-600 mt-1';
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }

            if (btnAceptarImagen) {
                btnAceptarImagen.addEventListener('click', () => {
                    if (!tempImageDataUrl) {
                        this.showModal('Primero selecciona una imagen desde tu dispositivo.', 'Imagen pendiente');
                        return;
                    }
                    confirmedImageDataUrl = tempImageDataUrl;
                    if (estadoImagenTexto) {
                        estadoImagenTexto.textContent = '✓ Imagen de perfil aceptada correctamente.';
                        estadoImagenTexto.className = 'text-xs fw-bold text-success mt-1';
                    }
                });
            }

            registroForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const nombre = (nombreInput?.value || '').trim();
                const email = (emailInput?.value || '').trim();
                const saldoRaw = (saldoInput?.value ?? '').trim();
                const pass = passInput?.value || '';
                const confirm = confirmInput?.value || '';

                if (nombre.length < 2) {
                    this.showModal('Por favor ingresa tu Nombre Completo.', 'Datos incompletos');
                    return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    this.showModal('Por favor ingresa un correo electrónico válido.', 'Correo inválido');
                    return;
                }

                const saldoInicial = saldoRaw === '' ? 0 : parseFloat(saldoRaw);
                if (isNaN(saldoInicial) || saldoInicial < 0) {
                    this.showModal('El saldo inicial debe ser 0 o una cantidad positiva.', 'Saldo inválido');
                    return;
                }

                if (pass.length < 4) {
                    this.showModal('La contraseña debe tener al menos 4 caracteres.', 'Contraseña corta');
                    return;
                }

                if (pass !== confirm) {
                    this.showModal('La contraseña y su confirmación no coinciden.', 'Verifica tu contraseña');
                    return;
                }

                if (checkPrivacidad && !checkPrivacidad.checked) {
                    this.showModal('Debes marcar la casilla del aviso de privacidad para crear tu cuenta.', 'Aviso de privacidad');
                    return;
                }

                const finalAvatar = confirmedImageDataUrl || tempImageDataUrl || '';

                memoryState.registerAccount({
                    nombre: nombre,
                    email: email,
                    password: pass,
                    saldoBase: saldoInicial,
                    avatarDataUrl: finalAvatar
                });

                global.location.href = 'index.html';
            });
        }

        /**
         * --------------------------------------------------------------------
         * PANTALLA 3: DASHBOARD PRINCIPAL - index.html
         * --------------------------------------------------------------------
         */
        initDashboardScreen() {
            const metricsContent = document.getElementById('dashboard-metrics-content');
            if (!metricsContent) return;

            const refreshBtn = document.getElementById('btn-refresh-metrics');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.triggerDashboardLoader(450);
                });
            }

            this.triggerDashboardLoader(380);
        }

        triggerDashboardLoader(durationMs = 400) {
            const loader = document.getElementById('tech-loader');
            const content = document.getElementById('dashboard-metrics-content');

            if (loader && content) {
                loader.classList.add('active');
                content.style.opacity = '0.4';
                content.style.pointerEvents = 'none';

                setTimeout(() => {
                    const balance = memoryState.getBalance();
                    const transactions = memoryState.getTransactions();
                    const report = memoryState.getReport();

                    FinanceView.renderDashboard(balance, transactions, report);
                    this.refreshGlobalStatus();

                    loader.classList.remove('active');
                    content.style.opacity = '1';
                    content.style.pointerEvents = 'auto';
                }, durationMs);
            } else {
                const balance = memoryState.getBalance();
                const transactions = memoryState.getTransactions();
                const report = memoryState.getReport();
                FinanceView.renderDashboard(balance, transactions, report);
            }
        }

        /**
         * --------------------------------------------------------------------
         * PANTALLA 4: REGISTRO DE MOVIMIENTOS - movimientos.html
         * --------------------------------------------------------------------
         */
        initMovimientosScreen() {
            const form = document.getElementById('movimientos-form');
            if (!form) return;

            const tipoInput = document.getElementById('tx-tipo');
            const btnTipoIngreso = document.getElementById('btn-tipo-ingreso');
            const btnTipoEgreso = document.getElementById('btn-tipo-egreso');
            const montoInput = document.getElementById('tx-monto');
            const categoriaSelect = document.getElementById('tx-categoria');
            const fechaInput = document.getElementById('tx-fecha');
            const descInput = document.getElementById('tx-descripcion');
            const successBanner = document.getElementById('tx-success-banner');

            if (fechaInput && !fechaInput.value) {
                fechaInput.value = new Date().toISOString().split('T')[0];
            }

            const renderCategoriasPorTipo = (tipoSeleccionado) => {
                if (!categoriaSelect) return;
                const opciones = Category.getByType(tipoSeleccionado);
                categoriaSelect.innerHTML = opciones.map((cat, idx) =>
                    `<option value="${cat.nombre}" ${idx === 0 ? 'selected' : ''}>${cat.nombre}</option>`
                ).join('');
            };

            const setTipo = (nuevoTipo) => {
                if (tipoInput) tipoInput.value = nuevoTipo;
                if (btnTipoIngreso && btnTipoEgreso) {
                    if (nuevoTipo === 'Ingreso') {
                        btnTipoIngreso.className = 'btn btn-royal flex-fill fw-bold';
                        btnTipoEgreso.className = 'btn btn-outline-secondary flex-fill fw-semibold';
                    } else {
                        btnTipoEgreso.className = 'btn btn-royal flex-fill fw-bold';
                        btnTipoIngreso.className = 'btn btn-outline-secondary flex-fill fw-semibold';
                    }
                }
                renderCategoriasPorTipo(nuevoTipo);
            };

            // Inicializar categorías de Ingreso por defecto (8 opciones)
            renderCategoriasPorTipo('Ingreso');

            if (btnTipoIngreso) btnTipoIngreso.addEventListener('click', () => setTipo('Ingreso'));
            if (btnTipoEgreso) btnTipoEgreso.addEventListener('click', () => setTipo('Egreso'));

            FinanceView.renderMovimientosSidebar(memoryState.getBalance(), memoryState.getTransactions());

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (successBanner) successBanner.classList.remove('show');

                const tipo = tipoInput ? tipoInput.value : 'Ingreso';
                const monto = parseFloat(montoInput?.value || '0');
                const categoria = categoriaSelect?.value || '';
                const fecha = fechaInput?.value || '';
                const descripcion = (descInput?.value || '').trim();

                if (isNaN(monto) || monto <= 0) {
                    this.showModal('El monto debe ser una cantidad mayor a $0.00.', 'Monto inválido');
                    return;
                }

                const categoriasValidas = Category.getCatalog().map(c => c.nombre);
                if (!categoriasValidas.includes(categoria)) {
                    this.showModal('Selecciona una categoría de la lista.', 'Categoría requerida');
                    return;
                }

                if (!fecha) {
                    this.showModal('Selecciona la fecha del movimiento.', 'Fecha requerida');
                    return;
                }

                if (descripcion.length < 2) {
                    this.showModal('Ingresa una descripción para este movimiento.', 'Descripción requerida');
                    return;
                }

                const nuevaTx = memoryState.addTransaction({
                    tipo,
                    monto,
                    categoria,
                    fecha,
                    descripcion
                });

                this.refreshGlobalStatus();
                FinanceView.renderMovimientosSidebar(memoryState.getBalance(), memoryState.getTransactions());

                if (successBanner) {
                    const detailSpan = successBanner.querySelector('[data-tx-saved-detail]');
                    if (detailSpan) {
                        detailSpan.textContent = `${nuevaTx.tipo} de ${FinanceView.formatMoney(nuevaTx.monto)} en ${nuevaTx.categoria}`;
                    }
                    successBanner.classList.add('show');
                }

                if (montoInput) montoInput.value = '';
                if (descInput) descInput.value = '';
                montoInput?.focus();
            });
        }

        /**
         * --------------------------------------------------------------------
         * PANTALLA 5: HISTORIAL Y REPORTES - reportes.html
         * --------------------------------------------------------------------
         */
        initReportesScreen() {
            const tableBody = document.getElementById('reportes-table-body');
            if (!tableBody) return;

            const filterTipoBtns = document.querySelectorAll('[data-filter-tipo]');
            const filterCatSelect = document.getElementById('filter-categoria');
            const filterSearchInput = document.getElementById('filter-busqueda');
            const clearFiltersBtn = document.getElementById('btn-clear-filters');

            filterTipoBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterTipoBtns.forEach(b => {
                        b.classList.remove('badge-aqua');
                        b.classList.add('btn-outline-secondary');
                    });
                    btn.classList.add('badge-aqua');
                    btn.classList.remove('btn-outline-secondary');

                    this.activeFilters.tipo = btn.getAttribute('data-filter-tipo') || 'TODOS';
                    this.applyReportesFilters();
                });
            });

            if (filterCatSelect) {
                filterCatSelect.addEventListener('change', () => {
                    this.activeFilters.categoria = filterCatSelect.value || 'TODAS';
                    this.applyReportesFilters();
                });
            }

            if (filterSearchInput) {
                filterSearchInput.addEventListener('input', () => {
                    this.activeFilters.busqueda = (filterSearchInput.value || '').trim().toLowerCase();
                    this.applyReportesFilters();
                });
            }

            if (clearFiltersBtn) {
                clearFiltersBtn.addEventListener('click', () => {
                    this.activeFilters = { tipo: 'TODOS', categoria: 'TODAS', busqueda: '' };
                    if (filterCatSelect) filterCatSelect.value = 'TODAS';
                    if (filterSearchInput) filterSearchInput.value = '';
                    filterTipoBtns.forEach(b => {
                        const isTodos = b.getAttribute('data-filter-tipo') === 'TODOS';
                        b.classList.toggle('badge-aqua', isTodos);
                        b.classList.toggle('btn-outline-secondary', !isTodos);
                    });
                    this.applyReportesFilters();
                });
            }

            tableBody.addEventListener('click', (e) => {
                const delBtn = e.target.closest('[data-delete-tx]');
                if (!delBtn) return;
                const txId = delBtn.getAttribute('data-delete-tx');
                if (txId && memoryState.removeTransaction(txId)) {
                    this.refreshGlobalStatus();
                    this.applyReportesFilters();
                }
            });

            this.applyReportesFilters();
        }

        applyReportesFilters() {
            const report = memoryState.getReport({
                tipo: this.activeFilters.tipo,
                categoria: this.activeFilters.categoria
            });

            if (this.activeFilters.busqueda) {
                report.transacciones = report.transacciones.filter(tx =>
                    tx.descripcion.toLowerCase().includes(this.activeFilters.busqueda) ||
                    tx.categoria.toLowerCase().includes(this.activeFilters.busqueda) ||
                    tx.id.toLowerCase().includes(this.activeFilters.busqueda)
                );
                report.balance = new global.FinanceMVC.Models.Balance(
                    memoryState.state.saldoBase,
                    report.transacciones
                );
            }

            FinanceView.renderReportes(report, memoryState.getBalance());
        }
    }

    global.FinanceMVC = global.FinanceMVC || {};
    global.FinanceMVC.View = FinanceView;
    global.FinanceMVC.Controller = FinanceController;

    document.addEventListener('DOMContentLoaded', () => {
        const appController = new FinanceController();
        appController.init();
        global.FinanceMVC.app = appController;
    });
})(window);
