/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: js/models.js
 * Capa Arquitectónica: MODEL (Estructuras de Datos y Estado de Sesión)
 * ============================================================================
 */

(function (global) {
    'use strict';

    /**
     * 1. MODELO: Category (Categoría Financiera)
     * Incluye 8 categorías de Ingreso y 8 categorías de Egreso (incluyendo Otros).
     */
    class Category {
        constructor(id, nombre, tipoSugerido, badgeColor) {
            this.id = id;
            this.nombre = nombre;
            this.tipoSugerido = tipoSugerido;
            this.badgeColor = badgeColor;
        }

        static getCatalog() {
            return [
                // 8 Categorías de Ingreso
                new Category('cat-sueldo', 'Sueldo', 'Ingreso', '#15803D'),
                new Category('cat-inversion', 'Inversión', 'Ingreso', '#00D9FF'),
                new Category('cat-ventas', 'Ventas / Negocio', 'Ingreso', '#15803D'),
                new Category('cat-honorarios', 'Honorarios / Freelance', 'Ingreso', '#0D9488'),
                new Category('cat-bonos', 'Bonos y Aguinaldo', 'Ingreso', '#16A34A'),
                new Category('cat-beca', 'Beca / Apoyo', 'Ingreso', '#0284C7'),
                new Category('cat-reembolsos', 'Reembolsos', 'Ingreso', '#2563EB'),
                new Category('cat-otros-ingresos', 'Otros (Ingresos)', 'Ingreso', '#475569'),

                // 8 Categorías de Egreso
                new Category('cat-alimentos', 'Alimentos', 'Egreso', '#1D4ED8'),
                new Category('cat-transporte', 'Transporte', 'Egreso', '#3B5266'),
                new Category('cat-servicios', 'Servicios', 'Egreso', '#475569'),
                new Category('cat-vivienda', 'Vivienda / Renta', 'Egreso', '#7C3AED'),
                new Category('cat-salud', 'Salud y Farmacia', 'Egreso', '#DC2626'),
                new Category('cat-educacion', 'Educación', 'Egreso', '#2563EB'),
                new Category('cat-ocio', 'Ocio', 'Egreso', '#B91C1C'),
                new Category('cat-otros-gastos', 'Otros (Gastos)', 'Egreso', '#64748B')
            ];
        }

        static getByType(tipo) {
            return Category.getCatalog().filter(cat => cat.tipoSugerido === tipo);
        }
    }

    /**
     * 2. MODELO: Transaction (Movimiento Financiero)
     */
    class Transaction {
        constructor({ id, tipo, monto, categoria, fecha, descripcion, timestamp }) {
            this.id = id || 'MOV-' + Math.floor(1000 + Math.random() * 9000);
            this.tipo = tipo === 'Ingreso' ? 'Ingreso' : 'Egreso';
            this.monto = Number(parseFloat(monto || 0).toFixed(2));
            this.categoria = categoria;
            this.fecha = fecha;
            this.descripcion = (descripcion || '').trim();
            this.timestamp = timestamp || Date.now();
        }
    }

    /**
     * 3. MODELO: Balance (Cálculo de Saldos e Indicadores)
     */
    class Balance {
        constructor(saldoBase, transacciones = []) {
            const parsedBase = parseFloat(saldoBase);
            this.saldoBase = isNaN(parsedBase) ? 0 : Number(parsedBase.toFixed(2));

            const ingresosList = transacciones.filter(t => t.tipo === 'Ingreso');
            const egresosList = transacciones.filter(t => t.tipo === 'Egreso');

            this.totalIngresos = Number(
                ingresosList.reduce((acc, item) => acc + Number(item.monto), 0).toFixed(2)
            );
            this.totalEgresos = Number(
                egresosList.reduce((acc, item) => acc + Number(item.monto), 0).toFixed(2)
            );
            this.balanceNetoMes = Number((this.totalIngresos - this.totalEgresos).toFixed(2));
            this.saldoActual = Number((this.saldoBase + this.balanceNetoMes).toFixed(2));

            this.conteoIngresos = ingresosList.length;
            this.conteoEgresos = egresosList.length;
            this.totalMovimientos = transacciones.length;

            const volumenTotal = this.totalIngresos + this.totalEgresos;
            this.porcentajeIngresos = volumenTotal > 0
                ? Math.round((this.totalIngresos / volumenTotal) * 100)
                : 0;
            this.porcentajeEgresos = volumenTotal > 0
                ? 100 - this.porcentajeIngresos
                : 0;
        }
    }

    /**
     * 4. MODELO: Report (Agrupación de Movimientos y Categorías)
     */
    class Report {
        constructor(user, balance, transacciones) {
            this.usuario = user;
            this.balance = balance;
            this.transacciones = transacciones;
            this.desgloseCategorias = this.calcularDesglosePorCategoria(transacciones);
        }

        calcularDesglosePorCategoria(transacciones) {
            const mapa = {};
            Category.getCatalog().forEach(cat => {
                mapa[cat.nombre] = {
                    categoria: cat.nombre,
                    tipoSugerido: cat.tipoSugerido,
                    totalIngresos: 0,
                    totalEgresos: 0,
                    cantidad: 0
                };
            });

            transacciones.forEach(tx => {
                if (!mapa[tx.categoria]) {
                    mapa[tx.categoria] = {
                        categoria: tx.categoria,
                        tipoSugerido: tx.tipo,
                        totalIngresos: 0,
                        totalEgresos: 0,
                        cantidad: 0
                    };
                }
                if (tx.tipo === 'Ingreso') {
                    mapa[tx.categoria].totalIngresos += Number(tx.monto);
                } else {
                    mapa[tx.categoria].totalEgresos += Number(tx.monto);
                }
                mapa[tx.categoria].cantidad += 1;
            });

            return Object.values(mapa);
        }
    }

    /**
     * 5. SERVICIO DE ESTADO EN SESIÓN: MemoryStateService
     */
    class MemoryStateService {
        constructor() {
            this.BRIDGE_KEY = '__FINANZAS_APP_STATE_V2__';
            this.NAV_FLAG_KEY = '__FINANZAS_INTERNAL_NAV_V2__';

            this.state = this._getCleanInitialState();
            this._initializeSessionMemory();
        }

        _getCleanInitialState() {
            return {
                saldoBase: 0,
                usuarioActual: null,
                cuentasRegistradas: [],
                transacciones: [],
                notificaciones: []
            };
        }

        _isBrowserPageReload() {
            try {
                if (global.performance && typeof global.performance.getEntriesByType === 'function') {
                    const entries = global.performance.getEntriesByType('navigation');
                    if (entries && entries.length > 0 && entries[0].type === 'reload') {
                        return true;
                    }
                }
                if (global.performance && global.performance.navigation && global.performance.navigation.type === 1) {
                    return true;
                }
            } catch (e) {
                // Ignorar
            }
            return false;
        }

        _initializeSessionMemory() {
            const wasReloaded = this._isBrowserPageReload();
            const hasInternalNavFlag = this._readNavFlag();

            if (wasReloaded) {
                this.resetMemory();
                return;
            }

            const restored = this._restoreFromVolatileBridge();
            if (!restored || !hasInternalNavFlag) {
                this.state = this._getCleanInitialState();
                this._syncToVolatileBridge();
                this._markInternalNavigation();
            }
        }

        _readNavFlag() {
            try {
                return sessionStorage.getItem(this.NAV_FLAG_KEY) === 'active';
            } catch (e) {
                return Boolean(global.name && global.name.startsWith(this.BRIDGE_KEY));
            }
        }

        _markInternalNavigation() {
            try {
                sessionStorage.setItem(this.NAV_FLAG_KEY, 'active');
            } catch (e) {
                // Ignorar
            }
        }

        _syncToVolatileBridge() {
            const payload = JSON.stringify(this.state);
            try {
                sessionStorage.setItem(this.BRIDGE_KEY, payload);
                sessionStorage.setItem(this.NAV_FLAG_KEY, 'active');
            } catch (e) {
                // Fallback
            }
            try {
                global.name = this.BRIDGE_KEY + ':' + payload;
            } catch (e) {
                // Ignorar
            }
        }

        _restoreFromVolatileBridge() {
            try {
                let raw = null;
                try {
                    raw = sessionStorage.getItem(this.BRIDGE_KEY);
                } catch (e) {
                    raw = null;
                }
                if (!raw && global.name && global.name.startsWith(this.BRIDGE_KEY + ':')) {
                    raw = global.name.substring((this.BRIDGE_KEY + ':').length);
                }
                if (!raw) return false;

                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object') return false;

                this.state = {
                    saldoBase: Number(parsed.saldoBase ?? 0),
                    usuarioActual: parsed.usuarioActual || null,
                    cuentasRegistradas: Array.isArray(parsed.cuentasRegistradas) ? parsed.cuentasRegistradas : [],
                    transacciones: Array.isArray(parsed.transacciones)
                        ? parsed.transacciones.map(t => new Transaction(t))
                        : [],
                    notificaciones: Array.isArray(parsed.notificaciones) ? parsed.notificaciones : []
                };
                return true;
            } catch (e) {
                return false;
            }
        }

        resetMemory() {
            this.state = this._getCleanInitialState();
            this._syncToVolatileBridge();
            this._markInternalNavigation();
            return this.state;
        }

        isAuthenticated() {
            return Boolean(this.state.usuarioActual && this.state.usuarioActual.autenticado);
        }

        registerAccount({ nombre, email, password, saldoBase, avatarDataUrl }) {
            const cleanEmail = (email || '').trim().toLowerCase();
            const parsedSaldo = parseFloat(saldoBase);
            const initialBalance = isNaN(parsedSaldo) || parsedSaldo < 0 ? 0 : Number(parsedSaldo.toFixed(2));

            const nuevaCuenta = {
                nombre: (nombre || '').trim(),
                email: cleanEmail,
                password: password,
                saldoBase: initialBalance,
                avatarDataUrl: avatarDataUrl || '',
                autenticado: true
            };

            const idx = this.state.cuentasRegistradas.findIndex(c => c.email === cleanEmail);
            if (idx >= 0) {
                this.state.cuentasRegistradas[idx] = nuevaCuenta;
            } else {
                this.state.cuentasRegistradas.push(nuevaCuenta);
            }

            this.state.usuarioActual = { ...nuevaCuenta };
            this.state.saldoBase = initialBalance;
            this.state.transacciones = [];
            this.state.notificaciones = [];

            const montoFormateado = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(initialBalance);

            this.addNotification(`Notificación 1: Cuenta creada para ${nuevaCuenta.nombre} con saldo inicial de ${montoFormateado}`);
            this._syncToVolatileBridge();
            return this.state.usuarioActual;
        }

        loginAccount(email, password) {
            const cleanEmail = (email || '').trim().toLowerCase();
            const cuenta = this.state.cuentasRegistradas.find(c => c.email === cleanEmail);

            if (!cuenta) {
                return {
                    ok: false,
                    reason: 'NO_EXISTE',
                    message: 'La cuenta ingresada no existe. Por favor crea una cuenta para continuar.'
                };
            }

            if (cuenta.password !== password) {
                return {
                    ok: false,
                    reason: 'PASSWORD_INCORRECTO',
                    message: 'La contraseña ingresada es incorrecta. Verifica tus datos.'
                };
            }

            this.state.usuarioActual = {
                ...cuenta,
                autenticado: true
            };
            this.state.saldoBase = cuenta.saldoBase;

            const numNotif = this.state.notificaciones.length + 1;
            this.addNotification(`Notificación ${numNotif}: Inicio de sesión exitoso (${cuenta.nombre})`);
            this._syncToVolatileBridge();

            return {
                ok: true,
                user: this.state.usuarioActual
            };
        }

        logout() {
            if (this.state.usuarioActual) {
                const email = this.state.usuarioActual.email;
                const cuenta = this.state.cuentasRegistradas.find(c => c.email === email);
                if (cuenta) {
                    cuenta.saldoBase = this.state.saldoBase;
                }
            }
            this.state.usuarioActual = null;
            this._syncToVolatileBridge();
        }

        addNotification(texto) {
            const nueva = {
                id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 100),
                texto: texto,
                hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
            };
            this.state.notificaciones.unshift(nueva);
            this._syncToVolatileBridge();
            return nueva;
        }

        getNotifications() {
            return [...this.state.notificaciones];
        }

        getTransactions() {
            return [...this.state.transacciones].sort((a, b) => {
                if (a.fecha !== b.fecha) {
                    return a.fecha < b.fecha ? 1 : -1;
                }
                return b.timestamp - a.timestamp;
            });
        }

        addTransaction(txData) {
            const nuevaTx = new Transaction(txData);
            this.state.transacciones.unshift(nuevaTx);

            const montoStr = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(nuevaTx.monto);
            const signo = nuevaTx.tipo === 'Ingreso' ? '+' : '-';
            const numNotif = this.state.notificaciones.length + 1;

            this.addNotification(`Notificación ${numNotif}: ${nuevaTx.tipo} registrado (${nuevaTx.categoria}) por ${signo}${montoStr}`);
            this._syncToVolatileBridge();
            return nuevaTx;
        }

        removeTransaction(id) {
            const tx = this.state.transacciones.find(t => t.id === id);
            const initialLen = this.state.transacciones.length;
            this.state.transacciones = this.state.transacciones.filter(t => t.id !== id);
            const removed = this.state.transacciones.length < initialLen;
            if (removed) {
                const numNotif = this.state.notificaciones.length + 1;
                this.addNotification(`Notificación ${numNotif}: Movimiento eliminado (${tx ? tx.categoria : id})`);
                this._syncToVolatileBridge();
            }
            return removed;
        }

        getBalance() {
            return new Balance(this.state.saldoBase, this.state.transacciones);
        }

        getReport(filters = { tipo: 'TODOS', categoria: 'TODAS' }) {
            let lista = this.getTransactions();

            if (filters.tipo && filters.tipo !== 'TODOS') {
                lista = lista.filter(tx => tx.tipo === filters.tipo);
            }
            if (filters.categoria && filters.categoria !== 'TODAS') {
                lista = lista.filter(tx => tx.categoria === filters.categoria);
            }

            const balanceFiltrado = new Balance(this.state.saldoBase, lista);
            return new Report(this.getUser(), balanceFiltrado, lista);
        }

        getUser() {
            return this.state.usuarioActual ? { ...this.state.usuarioActual } : null;
        }
    }

    const memoryStateInstance = new MemoryStateService();

    global.FinanceMVC = global.FinanceMVC || {};
    global.FinanceMVC.Models = {
        Category,
        Transaction,
        Balance,
        Report,
        MemoryStateService,
        memoryState: memoryStateInstance
    };
})(window);
