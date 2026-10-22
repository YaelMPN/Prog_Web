/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: server/Data/FinanzasDbContext.cs
 * Framework Backend: ASP.NET Core Web API (.NET 8) + Entity Framework Core SQLite
 * Rol Arquitectónico: Contexto de Base de Datos Relacional (`DbContext`) que
 * materializa el esquema SQLite (`Data Source=finanzas.db`) normalizado hasta
 * la Tercera Forma Normal (3FN) e inyecta el Data Seeding de los catálogos.
 *
 * JUSTIFICACIÓN DBA DE NORMALIZACIÓN (1FN, 2FN, 3FN):
 * 1. Primera Forma Normal (1FN):
 *    Cada columna de las 7 tablas contiene valores escalares y atómicos. No se
 *    almacenan listas separadas por comas ni objetos JSON anidados.
 * 2. Segunda Forma Normal (2FN):
 *    Todas las tablas poseen una clave primaria simple (`Id`), y la totalidad de
 *    sus atributos no clave dependen funcionalmente de dicha clave primaria.
 * 3. Tercera Forma Normal (3FN):
 *    Se eliminaron todas las dependencias transitivas, propiedades visuales y
 *    columnas calculadas:
 *    - El nombre del Tipo de Movimiento ('Ingreso' / 'Egreso') reside únicamente
 *      en `TiposMovimiento` y se vincula a `Categorias` vía `TipoMovimientoId`.
 *    - `Categorias` contiene exclusivamente (`Id`, `Nombre`, `TipoMovimientoId`).
 *    - `Movimientos` referencia exclusivamente a `CategoriaId` (FK) y `UsuarioId` (FK),
 *      evitando almacenar strings redundantes de categoría o tipo.
 *    - `ConfiguracionesPresupuesto` aísla `SaldoInicial` y `LimiteMensual` en una
 *      relación 1:1 con `Usuarios` (`UsuarioId` UNIQUE).
 *    - `MetasAhorro` solo guarda los parámetros base (`Nombre`, `MontoObjetivo`,
 *      `PlazoMeses`); la cuota mensual y viabilidad se calculan en el controlador/DTO.
 * ============================================================================
 */

using Microsoft.EntityFrameworkCore;
using FinanzasApi.Models;

namespace FinanzasApi.Data
{
    public class FinanzasDbContext : DbContext
    {
        public FinanzasDbContext(DbContextOptions<FinanzasDbContext> options)
            : base(options)
        {
        }

        public DbSet<TipoMovimiento> TiposMovimiento => Set<TipoMovimiento>();
        public DbSet<Categoria> Categorias => Set<Categoria>();
        public DbSet<Usuario> Usuarios => Set<Usuario>();
        public DbSet<ConfiguracionPresupuesto> ConfiguracionesPresupuesto => Set<ConfiguracionPresupuesto>();
        public DbSet<MovimientoEntity> Movimientos => Set<MovimientoEntity>();
        public DbSet<MetaAhorroEntity> MetasAhorro => Set<MetaAhorroEntity>();
        public DbSet<NotificacionEntity> Notificaciones => Set<NotificacionEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Índices Únicos y Relaciones 3FN
            modelBuilder.Entity<TipoMovimiento>()
                .HasIndex(t => t.Nombre)
                .IsUnique();

            modelBuilder.Entity<Categoria>()
                .HasIndex(c => c.Nombre)
                .IsUnique();

            modelBuilder.Entity<Categoria>()
                .HasOne(c => c.TipoMovimiento)
                .WithMany(t => t.Categorias)
                .HasForeignKey(c => c.TipoMovimientoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<ConfiguracionPresupuesto>()
                .HasIndex(cp => cp.UsuarioId)
                .IsUnique();

            modelBuilder.Entity<ConfiguracionPresupuesto>()
                .HasOne(cp => cp.Usuario)
                .WithOne(u => u.ConfiguracionPresupuesto)
                .HasForeignKey<ConfiguracionPresupuesto>(cp => cp.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MovimientoEntity>()
                .HasOne(m => m.Usuario)
                .WithMany(u => u.Movimientos)
                .HasForeignKey(m => m.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MovimientoEntity>()
                .HasOne(m => m.Categoria)
                .WithMany(c => c.Movimientos)
                .HasForeignKey(m => m.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MetaAhorroEntity>()
                .HasOne(ma => ma.Usuario)
                .WithMany(u => u.MetasAhorro)
                .HasForeignKey(ma => ma.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NotificacionEntity>()
                .HasOne(n => n.Usuario)
                .WithMany(u => u.Notificaciones)
                .HasForeignKey(n => n.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            // 2. DATA SEEDING INICIAL: 2 TiposMovimiento y 16 Categorias Oficiales (Sin BadgeColor)
            modelBuilder.Entity<TipoMovimiento>().HasData(
                new TipoMovimiento { Id = 1, Nombre = "Ingreso" },
                new TipoMovimiento { Id = 2, Nombre = "Egreso" }
            );

            modelBuilder.Entity<Categoria>().HasData(
                // 8 Categorías de Ingreso (TipoMovimientoId = 1)
                new Categoria { Id = 1, Nombre = "Sueldo", TipoMovimientoId = 1 },
                new Categoria { Id = 2, Nombre = "Inversión", TipoMovimientoId = 1 },
                new Categoria { Id = 3, Nombre = "Ventas / Negocio", TipoMovimientoId = 1 },
                new Categoria { Id = 4, Nombre = "Honorarios / Freelance", TipoMovimientoId = 1 },
                new Categoria { Id = 5, Nombre = "Bonos y Aguinaldo", TipoMovimientoId = 1 },
                new Categoria { Id = 6, Nombre = "Beca / Apoyo", TipoMovimientoId = 1 },
                new Categoria { Id = 7, Nombre = "Reembolsos", TipoMovimientoId = 1 },
                new Categoria { Id = 8, Nombre = "Otros (Ingresos)", TipoMovimientoId = 1 },

                // 8 Categorías de Egreso (TipoMovimientoId = 2)
                new Categoria { Id = 9,  Nombre = "Alimentos", TipoMovimientoId = 2 },
                new Categoria { Id = 10, Nombre = "Transporte", TipoMovimientoId = 2 },
                new Categoria { Id = 11, Nombre = "Servicios", TipoMovimientoId = 2 },
                new Categoria { Id = 12, Nombre = "Vivienda / Renta", TipoMovimientoId = 2 },
                new Categoria { Id = 13, Nombre = "Salud y Farmacia", TipoMovimientoId = 2 },
                new Categoria { Id = 14, Nombre = "Educación", TipoMovimientoId = 2 },
                new Categoria { Id = 15, Nombre = "Ocio", TipoMovimientoId = 2 },
                new Categoria { Id = 16, Nombre = "Otros (Gastos)", TipoMovimientoId = 2 }
            );
        }
    }
}
