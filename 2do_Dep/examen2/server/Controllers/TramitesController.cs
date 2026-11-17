using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TramitesApi.Context;
using TramitesApi.DTOs;
using TramitesApi.Models;

namespace TramitesApi.Controllers;

[ApiController]
[Route("api/tramites")]
public class TramitesController : ControllerBase
{
    private const long MaxPdf = 10 * 1024 * 1024;
    private const long MaxTxt = 5 * 1024 * 1024;

    private readonly TramitesDbContext _db;
    public TramitesController(TramitesDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TramiteResumenDto>>> Listar()
    {
        var datos = await _db.Tramites.AsNoTracking()
            .OrderByDescending(t => t.Id)
            .Select(t => new TramiteResumenDto(
                t.Id, t.Folio, t.FechaRegistro,
                t.Persona!.Nombre + " " + t.Persona.PrimerApellido + (t.Persona.SegundoApellido != null ? " " + t.Persona.SegundoApellido : ""),
                t.Persona.CURP, t.DatosEconomicos!.IngresoMensual,
                t.Documentos.Any(d => d.TipoDocumento == "PDF"),
                t.Documentos.Any(d => d.TipoDocumento == "TXT")))
            .ToListAsync();
        return Ok(datos);
    }

    [HttpPost]
    [RequestSizeLimit(20 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<TramiteCreadoDto>> Crear([FromForm] TramiteCreateForm f)
    {
        var pdf = f.ArchivoPdf!;
        var txt = f.ArchivoTxt!;

        if (!string.Equals(Path.GetExtension(pdf.FileName), ".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "El archivo PDF debe tener extensión .pdf." });
        if (pdf.Length == 0 || pdf.Length > MaxPdf)
            return BadRequest(new { error = "El archivo PDF no debe estar vacío ni superar 10 MB." });
        if (!string.Equals(Path.GetExtension(txt.FileName), ".txt", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "El archivo TXT debe tener extensión .txt." });
        if (txt.Length == 0 || txt.Length > MaxTxt)
            return BadRequest(new { error = "El archivo TXT no debe estar vacío ni superar 5 MB." });

        if (!await _db.Generos.AnyAsync(x => x.Id == f.GeneroId) ||
            !await _db.Estados.AnyAsync(x => x.Id == f.EstadoId) ||
            !await _db.Ocupaciones.AnyAsync(x => x.Id == f.OcupacionId))
            return BadRequest(new { error = "Género, estado u ocupación inválidos." });

        var curp = f.Curp.Trim().ToUpperInvariant();

        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var persona = await _db.Personas.FirstOrDefaultAsync(p => p.CURP == curp);
            if (persona == null)
            {
                persona = new Persona { CURP = curp };
                _db.Personas.Add(persona);
            }
            persona.Nombre = f.Nombre.Trim();
            persona.PrimerApellido = f.PrimerApellido.Trim();
            persona.SegundoApellido = string.IsNullOrWhiteSpace(f.SegundoApellido) ? null : f.SegundoApellido.Trim();
            persona.Correo = f.Correo.Trim();
            persona.Telefono = f.Telefono.Trim();
            persona.FechaNacimiento = f.FechaNacimiento!.Value;
            persona.GeneroId = f.GeneroId;

            var direccion = new Direccion
            {
                Calle = f.Calle.Trim(), NumeroExterior = f.NumeroExterior.Trim(),
                NumeroInterior = string.IsNullOrWhiteSpace(f.NumeroInterior) ? null : f.NumeroInterior.Trim(),
                Colonia = f.Colonia.Trim(), CodigoPostal = f.CodigoPostal, MunicipioAlcaldia = f.MunicipioAlcaldia.Trim(),
                EstadoId = f.EstadoId
            };
            var economicos = new DatosEconomicos
            {
                OcupacionId = f.OcupacionId, IngresoMensual = f.IngresoMensual,
                DependientesEconomicos = f.DependientesEconomicos, SituacionVivienda = f.SituacionVivienda
            };

            // Folio secuencial a partir del último Id registrado.
            var ultimoId = await _db.Tramites.MaxAsync(t => (int?)t.Id) ?? 0;
            var folio = $"TR-{ultimoId + 1:D5}";
            var ahora = DateTime.Now;

            var tramite = new Tramite
            {
                Folio = folio, FechaRegistro = ahora,
                Persona = persona, Direccion = direccion, DatosEconomicos = economicos
            };
            tramite.Documentos.Add(await CrearDocumento(pdf, "PDF", ".pdf", ahora));
            tramite.Documentos.Add(await CrearDocumento(txt, "TXT", ".txt", ahora));

            _db.Tramites.Add(tramite);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            var resultado = new TramiteCreadoDto(
                folio, ahora, $"{persona.Nombre} {persona.PrimerApellido} {persona.SegundoApellido}".Trim(),
                persona.CURP, economicos.IngresoMensual, pdf.FileName, txt.FileName);
            return Created($"/api/tramites/{folio}/reporte-simulado", resultado);
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync();
            return Conflict(new { error = "No fue posible registrar el trámite. Intente nuevamente." });
        }
    }

    [HttpGet("{folio}/reporte-simulado")]
    public async Task<IActionResult> ReporteSimulado(string folio)
    {
        var existe = await _db.Tramites.AnyAsync(t => t.Folio == folio);
        if (!existe) return NotFound(new { error = $"No existe el folio {folio}." });
        return Ok(new { folio, disponible = true, mensaje = $"Reporte del trámite {folio} disponible." });
    }

    private static async Task<Documento> CrearDocumento(IFormFile file, string tipo, string ext, DateTime fecha)
    {
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        return new Documento
        {
            TipoDocumento = tipo, NombreOriginal = Path.GetFileName(file.FileName), Extension = ext,
            TamanoBytes = file.Length, ArchivoBytes = ms.ToArray(), FechaCarga = fecha
        };
    }
}
