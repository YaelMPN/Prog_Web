/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: server/Models/Movimiento.cs
 * Framework Backend: ASP.NET Core Web API (.NET 8) - DTOs de Respuesta (MVC)
 * Rol Arquitectónico: Define los DTOs de transferencia JSON que proyectan las
 * entidades normalizadas en 3FN (`MovimientoEntity`, `Categoria`, `TipoMovimiento`,
 * `NotificacionEntity` y `Usuario`) hacia la estructura esperada por React + TS.
 * ============================================================================
 */

namespace FinanzasApi.Models
{
    /// <summary>
    /// DTO de salida para las transacciones proyectadas mediante JOIN (3FN).
    /// </summary>
    public class Movimiento
    {
        public string Id { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Ingreso";
        public decimal Monto { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO de entrada para crear un nuevo movimiento asociado a un UsuarioId.
    /// </summary>
    public class CrearMovimientoRequest
    {
        public int UsuarioId { get; set; }
        public string Tipo { get; set; } = "Ingreso";
        public decimal Monto { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO de salida del catálogo de 16 categorías desde la BD SQLite.
    /// </summary>
    public class CategoriaCatalogo
    {
        public string Id { get; set; } = string.Empty;
        public int CategoriaId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string TipoSugerido { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO de salida para las notificaciones almacenadas en la tabla Notificaciones.
    /// </summary>
    public class NotificacionItem
    {
        public string Id { get; set; } = string.Empty;
        public string Texto { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
        public bool Leida { get; set; }
    }

    /// <summary>
    /// DTO de entrada para Registro de Usuario en SQLite (Tablas Usuarios y ConfiguracionesPresupuesto).
    /// </summary>
    public class RegistroUsuarioRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public decimal SaldoInicial { get; set; } = 0m;
        public decimal LimiteMensual { get; set; } = 0m;
        public string AvatarDataUrl { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO de entrada para Login de Usuario contra la tabla Usuarios en SQLite.
    /// </summary>
    public class LoginUsuarioRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO seguro de respuesta con la información pública de la sesión del usuario.
    /// </summary>
    public class UsuarioDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string AvatarDataUrl { get; set; } = string.Empty;
        public decimal SaldoInicial { get; set; }
        public decimal LimiteMensual { get; set; }
    }
}
