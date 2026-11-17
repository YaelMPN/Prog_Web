using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TramitesApi.Context;
using TramitesApi.DTOs;

namespace TramitesApi.Controllers;

[ApiController]
[Route("api/catalogos")]
public class CatalogosController : ControllerBase
{
    private readonly TramitesDbContext _db;
    public CatalogosController(TramitesDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<CatalogosDto>> Get()
    {
        var generos = await _db.Generos.AsNoTracking().OrderBy(g => g.Id).Select(g => new { g.Id, g.Nombre }).ToListAsync();
        var estados = await _db.Estados.AsNoTracking().OrderBy(e => e.NombreEstado).Select(e => new { e.Id, e.NombreEstado, e.Clave }).ToListAsync();
        var ocupaciones = await _db.Ocupaciones.AsNoTracking().OrderBy(o => o.Id).Select(o => new { o.Id, o.Titulo }).ToListAsync();
        return new CatalogosDto(generos, estados, ocupaciones);
    }
}
