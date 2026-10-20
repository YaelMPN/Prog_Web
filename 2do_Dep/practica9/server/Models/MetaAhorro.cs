/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: server/Models/MetaAhorro.cs
 * Framework Backend: ASP.NET Core Web API (.NET) - Capa MODEL (MVC)
 * Rol Arquitectónico: Define los modelos de petición y respuesta para el
 * cálculo de proyecciones de ahorro y validación contra el flujo mensual.
 * ============================================================================
 */

namespace FinanzasApi.Models
{
    /// <summary>
    /// Petición enviada por el Simulador de Metas de Ahorro a POST /api/finanzas/metas/calcular.
    /// </summary>
    public class MetaAhorroRequest
    {
        public string Nombre { get; set; } = "Meta de Ahorro";
        public decimal MontoObjetivo { get; set; }
        public int PlazoMeses { get; set; } = 6;
        public bool UsarSaldoActual { get; set; } = false;
    }

    /// <summary>
    /// Representa un hito escalonado de proyección (25%, 50%, 75%, 100%).
    /// </summary>
    public class HitoProyeccionAhorro
    {
        public string Etapa { get; set; } = string.Empty;
        public string Mes { get; set; } = string.Empty;
        public decimal Monto { get; set; }
    }

    /// <summary>
    /// Modelo de resultado del cálculo y validación de una meta de ahorro.
    /// </summary>
    public class MetaAhorro
    {
        public string Id { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public decimal MontoObjetivo { get; set; }
        public int PlazoMeses { get; set; }
        public bool UsarSaldoActual { get; set; }
        public decimal SaldoDisponible { get; set; }
        public decimal FlujoMensualNeto { get; set; }
        public decimal CapitalInicialAplicado { get; set; }
        public decimal MontoRestante { get; set; }
        public decimal CuotaMensualRequerida { get; set; }
        public bool CubiertaPorSaldoActual { get; set; }
        public bool CubiertaPorFlujoMensual { get; set; }
        public decimal DiferenciaFlujoMensual { get; set; }
        public int PorcentajeCoberturaSaldo { get; set; }
        public int PorcentajeCoberturaFlujo { get; set; }
        public List<HitoProyeccionAhorro> Hitos { get; set; } = new();
    }
}

