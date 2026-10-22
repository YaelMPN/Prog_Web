/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: server/Models/MetaAhorro.cs
 * Framework Backend: ASP.NET Core Web API (.NET 8) - Capa MODEL / DTO (MVC)
 * Rol Arquitectónico: Define los DTOs de petición y respuesta para las metas
 * de ahorro almacenadas en `MetasAhorro` (3FN: el ahorro mensual requerido y la
 * viabilidad se calculan dinámicamente en el controlador/DTO).
 * ============================================================================
 */

namespace FinanzasApi.Models
{
    public class MetaAhorroRequest
    {
        public int UsuarioId { get; set; }
        public string Nombre { get; set; } = "Meta de Ahorro";
        public decimal MontoObjetivo { get; set; }
        public int PlazoMeses { get; set; } = 6;
        public bool UsarSaldoActual { get; set; } = false;
    }

    public class HitoProyeccionAhorro
    {
        public string Etapa { get; set; } = string.Empty;
        public string Mes { get; set; } = string.Empty;
        public decimal Monto { get; set; }
    }

    public class MetaAhorro
    {
        public string Id { get; set; } = string.Empty;
        public int NumericId { get; set; }
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
        public bool Viable { get; set; }
        public decimal DiferenciaFlujoMensual { get; set; }
        public int PorcentajeCoberturaSaldo { get; set; }
        public int PorcentajeCoberturaFlujo { get; set; }
        public List<HitoProyeccionAhorro> Hitos { get; set; } = new();
    }
}
