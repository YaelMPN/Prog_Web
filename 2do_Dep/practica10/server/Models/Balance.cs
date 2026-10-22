/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: server/Models/Balance.cs
 * Framework Backend: ASP.NET Core Web API (.NET 8) - Capa MODEL / DTO (MVC)
 * Rol Arquitectónico: Define la estructura calculada de saldos (sin persistir
 * columnas calculadas en BD, cumpliendo 3FN) y el DTO de configuración de
 * presupuesto (`SaldoInicial` y `LimiteMensual`).
 * ============================================================================
 */

namespace FinanzasApi.Models
{
    public class Balance
    {
        public decimal SaldoBase { get; set; }
        public decimal LimiteMensual { get; set; }
        public decimal TotalIngresos { get; set; }
        public decimal TotalEgresos { get; set; }
        public decimal BalanceNetoMes { get; set; }
        public decimal SaldoActual { get; set; }
        public int ConteoIngresos { get; set; }
        public int ConteoEgresos { get; set; }
        public int TotalMovimientos { get; set; }
        public int PorcentajeIngresos { get; set; }
        public int PorcentajeEgresos { get; set; }
    }

    public class DesgloseCategoria
    {
        public string Id { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string TipoSugerido { get; set; } = string.Empty;
        public decimal TotalIngresos { get; set; }
        public decimal TotalEgresos { get; set; }
        public int Cantidad { get; set; }
    }

    public class ActualizarSaldoBaseRequest
    {
        public int UsuarioId { get; set; }
        public decimal SaldoBase { get; set; }
        public decimal? LimiteMensual { get; set; }
    }
}
