/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: server/Models/Balance.cs
 * Framework Backend: ASP.NET Core Web API (.NET) - Capa MODEL (MVC)
 * Rol Arquitectónico: Define la estructura de saldos (SaldoActual, SaldoBase,
 * TotalIngresos, TotalEgresos, BalanceNetoMes), porcentajes y desglose por
 * categorías para abastecer al Dashboard, Reportes y Analítica en React.
 * ============================================================================
 */

namespace FinanzasApi.Models
{
    /// <summary>
    /// Modelo para saldo actual, ingresos totales, egresos, balance neto e indicadores porcentuales.
    /// </summary>
    public class Balance
    {
        public decimal SaldoBase { get; set; }
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

    /// <summary>
    /// Resumen acumulado por cada categoría del catálogo.
    /// </summary>
    public class DesgloseCategoria
    {
        public string Id { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public string TipoSugerido { get; set; } = string.Empty;
        public string BadgeColor { get; set; } = string.Empty;
        public decimal TotalIngresos { get; set; }
        public decimal TotalEgresos { get; set; }
        public int Cantidad { get; set; }
    }

    /// <summary>
    /// DTO para actualizar el Saldo Inicial Base desde el Dashboard.
    /// </summary>
    public class ActualizarSaldoBaseRequest
    {
        public decimal SaldoBase { get; set; }
    }
}

