/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: server/Models/Movimiento.cs
 * Framework Backend: ASP.NET Core Web API (.NET) - Capa MODEL (MVC)
 * Rol Arquitectónico: Representa la entidad de dominio de una transacción
 * financiera (Ingreso o Egreso) y el catálogo oficial de 16 categorías.
 * ============================================================================
 */

namespace FinanzasApi.Models
{
    /// <summary>
    /// Modelo de datos para las transacciones financieras registradas por el usuario.
    /// </summary>
    public class Movimiento
    {
        public string Id { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Ingreso"; // "Ingreso" o "Egreso"
        public decimal Monto { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public long Timestamp { get; set; }
    }

    /// <summary>
    /// DTO de entrada para crear un nuevo movimiento desde el cliente React.
    /// </summary>
    public class CrearMovimientoRequest
    {
        public string Tipo { get; set; } = "Ingreso";
        public decimal Monto { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
    }

    /// <summary>
    /// Representa una categoría del catálogo financiero (8 de Ingreso y 8 de Egreso).
    /// </summary>
    public class CategoriaCatalogo
    {
        public string Id { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string TipoSugerido { get; set; } = string.Empty;
        public string BadgeColor { get; set; } = string.Empty;
    }

    /// <summary>
    /// Representa una notificación generada en la sesión del servidor.
    /// </summary>
    public class NotificacionItem
    {
        public string Id { get; set; } = string.Empty;
        public string Texto { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
    }
}

