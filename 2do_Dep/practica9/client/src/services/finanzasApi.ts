/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: client/src/services/finanzasApi.ts
 * Framework Frontend: React + TypeScript (Servicio HTTP de Comunicación MVC)
 * Rol Arquitectónico: Define las interfaces de datos en TypeScript equivalentes
 * a los Modelos de C# y gestiona las llamadas fetch() hacia los endpoints de
 * ASP.NET Core Web API (http://localhost:5000/api/finanzas).
 * ============================================================================
 */

export const API_BASE_URL = 'http://localhost:5000/api/finanzas';

export interface Movimiento {
    id: string;
    tipo: 'Ingreso' | 'Egreso';
    monto: number;
    categoria: string;
    fecha: string;
    descripcion: string;
    timestamp: number;
}

export interface CrearMovimientoDTO {
    tipo: 'Ingreso' | 'Egreso';
    monto: number;
    categoria: string;
    fecha: string;
    descripcion: string;
}

export interface Balance {
    saldoBase: number;
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
    badgeColor?: string;
    totalIngresos: number;
    totalEgresos: number;
    cantidad: number;
}

export interface NotificacionItem {
    id: string;
    texto: string;
    hora: string;
}

export interface MetaAhorroRequest {
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
    diferenciaFlujoMensual: number;
    porcentajeCoberturaSaldo: number;
    porcentajeCoberturaFlujo: number;
    hitos: HitoProyeccionAhorro[];
}

export interface FinanzasStateResponse {
    ok: boolean;
    titulo?: string;
    message?: string;
    balance?: Balance;
    transacciones?: Movimiento[];
    desgloseCategorias?: DesgloseCategoria[];
    notificaciones?: NotificacionItem[];
    movimiento?: Movimiento;
    meta?: MetaAhorro;
}

/**
 * Servicio cliente en TypeScript para consumir el controlador FinanzasController.cs (.NET)
 */
export const finanzasApi = {
    async obtenerBalance(): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/balance`);
        return res.json();
    },

    async actualizarSaldoBase(saldoBase: number): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/balance`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ saldoBase })
        });
        return res.json();
    },

    async obtenerMovimientos(): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/movimientos`);
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

    async eliminarMovimiento(id: string): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/movimientos/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    async calcularMetaAhorro(payload: MetaAhorroRequest): Promise<FinanzasStateResponse> {
        const res = await fetch(`${API_BASE_URL}/metas/calcular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res.json();
    }
};

