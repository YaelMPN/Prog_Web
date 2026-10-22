/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: server/Models/Entidades3FN.cs
 * Framework Backend: ASP.NET Core Web API (.NET 8) + Entity Framework Core SQLite
 * Rol Arquitectónico: Definición de las 7 Entidades Relacionales normalizadas
 * estrictamente hasta la Tercera Forma Normal (1FN, 2FN y 3FN):
 *
 * - Primera Forma Normal (1FN): Todos los atributos son atómicos e indivisibles;
 *   no existen grupos repetitivos ni arreglos serializados dentro de columnas.
 * - Segunda Forma Normal (2FN): Cumple 1FN y cada atributo no clave depende de
 *   forma completa de la clave primaria única (Id) de su respectiva tabla.
 * - Tercera Forma Normal (3FN): Cumple 2FN y no existen dependencias transitivas,
 *   atributos visuales redundantes ni columnas calculadas almacenadas:
 *     * `Categorias` almacena únicamente datos puros del dominio (`Id`, `Nombre`,
 *       `TipoMovimientoId`), sin mezclar colores de presentación visual.
 *     * `Movimientos` solo almacena `CategoriaId` (FK), sin duplicar el nombre de
 *       la categoría ni el nombre del tipo de movimiento (`Ingreso`/`Egreso`),
 *       los cuales se resuelven mediante JOIN (`Include` -> `ThenInclude`).
 *     * `ConfiguracionesPresupuesto` separa los parámetros presupuestales del
 *       perfil de identidad de `Usuarios` (relación 1:1 por `UsuarioId` UNIQUE).
 *     * `MetasAhorro` almacena únicamente los datos fuente (`Nombre`, `MontoObjetivo`,
 *       `PlazoMeses`), mientras que la cuota mensual y viabilidad se calculan en
 *       tiempo de ejecución en el controlador/DTO.
 * ============================================================================
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinanzasApi.Models
{
    /// <summary>
    /// 1. Tabla TiposMovimiento (Catálogo Maestro 3FN)
    /// Almacena únicamente 'Ingreso' (Id=1) y 'Egreso' (Id=2).
    /// </summary>
    [Table("TiposMovimiento")]
    public class TipoMovimiento
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(30)]
        public string Nombre { get; set; } = string.Empty;

        public ICollection<Categoria> Categorias { get; set; } = new List<Categoria>();
    }

    /// <summary>
    /// 2. Tabla Categorias (Catálogo Normalizado en 3FN)
    /// Depende de TiposMovimiento mediante la clave foránea TipoMovimientoId.
    /// </summary>
    [Table("Categorias")]
    public class Categoria
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(80)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        public int TipoMovimientoId { get; set; }

        [ForeignKey(nameof(TipoMovimientoId))]
        public TipoMovimiento? TipoMovimiento { get; set; }

        public ICollection<MovimientoEntity> Movimientos { get; set; } = new List<MovimientoEntity>();
    }

    /// <summary>
    /// 3. Tabla Usuarios (Entidad de Identidad y Autenticación en 3FN)
    /// </summary>
    [Table("Usuarios")]
    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(120)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Password { get; set; } = string.Empty;

        public string AvatarDataUrl { get; set; } = string.Empty;

        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

        public ConfiguracionPresupuesto? ConfiguracionPresupuesto { get; set; }
        public ICollection<MovimientoEntity> Movimientos { get; set; } = new List<MovimientoEntity>();
        public ICollection<MetaAhorroEntity> MetasAhorro { get; set; } = new List<MetaAhorroEntity>();
        public ICollection<NotificacionEntity> Notificaciones { get; set; } = new List<NotificacionEntity>();
    }

    /// <summary>
    /// 4. Tabla ConfiguracionesPresupuesto (Parámetros Financieros por Usuario en 3FN)
    /// Relación 1:1 con Usuarios mediante UsuarioId UNIQUE.
    /// </summary>
    [Table("ConfiguracionesPresupuesto")]
    public class ConfiguracionPresupuesto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario? Usuario { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SaldoInicial { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LimiteMensual { get; set; }
    }

    /// <summary>
    /// 5. Tabla Movimientos (Transacciones Financieras en 3FN)
    /// Cumple estrictamente 3FN: NO almacena el nombre de la categoría ni el tipo
    /// como texto redundante; referencia a `CategoriaId` y resuelve el tipo a través
    /// de `.Include(m => m.Categoria).ThenInclude(c => c.TipoMovimiento)`.
    /// El campo `Timestamp` guarda la fecha y hora exacta de registro en formato legible.
    /// </summary>
    [Table("Movimientos")]
    public class MovimientoEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario? Usuario { get; set; }

        [Required]
        public int CategoriaId { get; set; }

        [ForeignKey(nameof(CategoriaId))]
        public Categoria? Categoria { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }

        [Required]
        [MaxLength(20)]
        public string Fecha { get; set; } = string.Empty;

        [Required]
        [MaxLength(300)]
        public string Descripcion { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Timestamp { get; set; } = string.Empty;
    }

    /// <summary>
    /// 6. Tabla MetasAhorro (Metas Financieras por Usuario en 3FN)
    /// Cumple 3FN: Solo persiste los atributos base (Nombre, MontoObjetivo, PlazoMeses).
    /// La cuota mensual requerida y la viabilidad se calculan dinámicamente en el DTO.
    /// </summary>
    [Table("MetasAhorro")]
    public class MetaAhorroEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario? Usuario { get; set; }

        [Required]
        [MaxLength(150)]
        public string Nombre { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal MontoObjetivo { get; set; }

        public int PlazoMeses { get; set; }
    }

    /// <summary>
    /// 7. Tabla Notificaciones (Historial de Alertas del Usuario en 3FN)
    /// </summary>
    [Table("Notificaciones")]
    public class NotificacionEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [ForeignKey(nameof(UsuarioId))]
        public Usuario? Usuario { get; set; }

        [Required]
        [MaxLength(400)]
        public string Texto { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Hora { get; set; } = string.Empty;

        public bool Leida { get; set; } = false;
    }
}
