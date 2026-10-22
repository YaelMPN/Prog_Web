/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: client/src/services/finanzasApi.ts
 * Framework Frontend: React + TypeScript (Servicio HTTP de Comunicación MVC)
 * Rol Arquitectónico: Define las interfaces de datos en TypeScript equivalentes
 * a los DTOs normalizados en 3FN de C# y gestiona las llamadas fetch() hacia
 * los endpoints de ASP.NET Core Web API (compatible en PC, Wi-Fi y cable USB).
 * ============================================================================
 */

const currentHost =
    typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'localhost';

export const API_BASE_URL = `http://${currentHost}:5000/api/finanzas`;

export interface UsuarioSesion {
    id: number;
    nombre: string;
    email: string;
    avatarDataUrl: string;
    saldoInicial: number;
    limiteMensual: number;
}

export interface RegistroUsuarioDTO {
    nombre: string;
    email: string;
    password: string;
    saldoInicial: number;
    limiteMensual?: number;
    avatarDataUrl?: string;
}

export interface LoginUsuarioDTO {
    email: string;
    password: string;
}

export interface Movimiento {
    id: string;
    tipo: 'Ingreso' | 'Egreso';
    monto: number;
    categoria: string;
    fecha: string;
    descripcion: string;
    timestamp: string;
}

export interface CrearMovimientoDTO {
    usuarioId: number;
    tipo: 'Ingreso' | 'Egreso';
    monto: number;
    categoria: string;
    fecha: string;
    descripcion: string;
}

export interface Balance {
    saldoBase: number;
    limiteMensual: number;
    totalIngresos: number;
    totalEgresos: number;
    balanceNetoMes: number;
    saldoActual: number;
    conteoIngresos: number;
    conteoEgresos: number;
    totalMovimientos: number;
    porcentajeIngresos: number;
    porcentajeEgresos: number;
}

export interface DesgloseCategoria {
    id?: string;
    categoria: string;
    tipoSugerido: 'Ingreso' | 'Egreso';
    totalIngresos: number;
    totalEgresos: number;
    cantidad: number;
}

export interface CategoriaCatalogoItem {
    id: string;
    categoriaId: number;
    nombre: string;
    tipoSugerido: 'Ingreso' | 'Egreso';
}

export interface NotificacionItem {
    id: string;
    texto: string;
    hora: string;
    leida?: boolean;
}

export interface MetaAhorroRequest {
    usuarioId: number;
    nombre: string;
    montoObjetivo: number;
    plazoMeses: number;
    usarSaldoActual: boolean;
}

export interface HitoProyeccionAhorro {
    etapa: string;
    mes: string;
    monto: number;
}

export interface MetaAhorro {
    id: string;
    numericId?: number;
    nombre: string;
    montoObjetivo: number;
    plazoMeses: number;
    usarSaldoActual: boolean;
    saldoDisponible: number;
    flujoMensualNeto: number;
    capitalInicialAplicado: number;
    montoRestante: number;
    cuotaMensualRequerida: number;
    cubiertaPorSaldoActual: boolean;
    cubiertaPorFlujoMensual: boolean;
    viable?: boolean;
    diferenciaFlujoMensual: number;
    porcentajeCoberturaSaldo: number;
    porcentajeCoberturaFlujo: number;
    hitos: HitoProyeccionAhorro[];
}

export interface FinanzasStateResponse {
    ok: boolean;
    codigo?: string;
    titulo?: string;
    message?: string;
    balance?: Balance;
    transacciones?: Movimiento[];
    desgloseCategorias?: DesgloseCategoria[];
    notificaciones?: NotificacionItem[];
    categorias?: CategoriaCatalogoItem[];
    metas?: MetaAhorro[];
    movimiento?: Movimiento;
    meta?: MetaAhorro;
}

export interface AuthResponse {
    ok: boolean;
    codigo?: string;
    titulo?: string;
    message?: string;
    usuario?: UsuarioSesion;
    estado?: FinanzasStateResponse;
}

/**
 * Servicio cliente en TypeScript para consumir FinanzasController.cs (.NET 8)
 */
export const finanzasApi = {
    async registrarUsuario(payload: RegistroUsuarioDTO): Promise<AuthResponse> {
        const res = await fetch(`${API_BASE_URL}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res.json();
    },

    async loginUsuario(payload: LoginUsuarioDTO): Promise<AuthResponse> {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res.json();
    },

    async obtenerBalance(usuarioId: number): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/balance?usuarioId=${encodeURIComponent(usuarioId)}`);
        return res.json();
    },

    async actualizarSaldoBase(
        usuarioId: number,
        saldoBase: number,
        limiteMensual?: number
    ): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/balance`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioId,
                saldoBase,
                limiteMensual
            })
        });
        return res.json();
    },

    async obtenerMovimientos(usuarioId: number): Promise<FinanzasStateResponse> {
        const res = await fetch(
            `${API_BASE_URL}/movimientos?usuarioId=${encodeURIComponent(usuarioId)}`
        );
        return res.json();
    },

    async registrarMovimiento(payload: CrearMovimientoDTO): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/movimientos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res.json();
    },

    async eliminarMovimiento(id: string, usuarioId: number): Promise<FinanzasStateResponse> {
        const res = await fetch(
            `${API_BASE_URL}/movimientos/${encodeURIComponent(id)}?usuarioId=${encodeURIComponent(
                usuarioId
            )}`,
            {
                method: 'DELETE'
            }
        );
        return res.json();
    },

    async obtenerMetas(usuarioId: number): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/metas?usuarioId=${encodeURIComponent(usuarioId)}`);
        return res.json();
    },

    async calcularMetaAhorro(payload: MetaAhorroRequest): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/metas/calcular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res.json();
    },

    async eliminarMetaAhorro(id: string, usuarioId: number): Promise<FinanzasStateResponse> {
        const res = await fetch(
            `${API_BASE_URL}/metas/${encodeURIComponent(id)}?usuarioId=${encodeURIComponent(
                usuarioId
            )}`,
            {
                method: 'DELETE'
            }
        );
        return res.json();
    }
};
