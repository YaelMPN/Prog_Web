using Microsoft.EntityFrameworkCore;
using TramitesApi.Models;

namespace TramitesApi.Context;

public class TramitesDbContext : DbContext
{
    public TramitesDbContext(DbContextOptions<TramitesDbContext> options) : base(options) { }

    public DbSet<Genero> Generos => Set<Genero>();
    public DbSet<Estado> Estados => Set<Estado>();
    public DbSet<Ocupacion> Ocupaciones => Set<Ocupacion>();
    public DbSet<Persona> Personas => Set<Persona>();
    public DbSet<Direccion> Direcciones => Set<Direccion>();
    public DbSet<DatosEconomicos> DatosEconomicos => Set<DatosEconomicos>();
    public DbSet<Tramite> Tramites => Set<Tramite>();
    public DbSet<Documento> Documentos => Set<Documento>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Persona>().HasIndex(p => p.CURP).IsUnique();
        b.Entity<Tramite>().HasIndex(t => t.Folio).IsUnique();
        b.Entity<DatosEconomicos>().Property(d => d.IngresoMensual).HasColumnType("decimal(18,2)");

        b.Entity<Persona>().HasOne(p => p.Genero).WithMany().HasForeignKey(p => p.GeneroId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Direccion>().HasOne(d => d.Estado).WithMany().HasForeignKey(d => d.EstadoId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<DatosEconomicos>().HasOne(d => d.Ocupacion).WithMany().HasForeignKey(d => d.OcupacionId).OnDelete(DeleteBehavior.Restrict);

        b.Entity<Tramite>().HasOne(t => t.Persona).WithMany().HasForeignKey(t => t.PersonaId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Tramite>().HasOne(t => t.Direccion).WithMany().HasForeignKey(t => t.DireccionId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Tramite>().HasOne(t => t.DatosEconomicos).WithMany().HasForeignKey(t => t.DatosEconomicosId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Documento>().HasOne(d => d.Tramite).WithMany(t => t.Documentos).HasForeignKey(d => d.TramiteId).OnDelete(DeleteBehavior.Cascade);
    }

    public static void Sembrar(TramitesDbContext db)
    {
        if (!db.Generos.Any())
            db.Generos.AddRange(new[] { "Masculino", "Femenino", "No binario" }.Select(n => new Genero { Nombre = n }));

        if (!db.Estados.Any())
        {
            var estados = new (string Clave, string Nombre)[]
            {
                ("AGS","Aguascalientes"),("BC","Baja California"),("BCS","Baja California Sur"),("CAM","Campeche"),
                ("CHP","Chiapas"),("CHH","Chihuahua"),("CDMX","Ciudad de México"),("COA","Coahuila"),
                ("COL","Colima"),("DGO","Durango"),("GTO","Guanajuato"),("GRO","Guerrero"),
                ("HGO","Hidalgo"),("JAL","Jalisco"),("MEX","Estado de México"),("MIC","Michoacán"),
                ("MOR","Morelos"),("NAY","Nayarit"),("NL","Nuevo León"),("OAX","Oaxaca"),
                ("PUE","Puebla"),("QRO","Querétaro"),("QROO","Quintana Roo"),("SLP","San Luis Potosí"),
                ("SIN","Sinaloa"),("SON","Sonora"),("TAB","Tabasco"),("TAM","Tamaulipas"),
                ("TLAX","Tlaxcala"),("VER","Veracruz"),("YUC","Yucatán"),("ZAC","Zacatecas")
            };
            db.Estados.AddRange(estados.Select(e => new Estado { Clave = e.Clave, NombreEstado = e.Nombre }));
        }

        if (!db.Ocupaciones.Any())
            db.Ocupaciones.AddRange(new[] { "Empleado", "Comerciante", "Profesionista Independiente", "Estudiante", "Hogar", "Otro" }
                .Select(t => new Ocupacion { Titulo = t }));

        db.SaveChanges();
    }
}
