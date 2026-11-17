using System.ComponentModel.DataAnnotations;

namespace TramitesApi.Models;

public class Tramite
{
    public int Id { get; set; }
    [Required, MaxLength(20)] public string Folio { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; }
    public int PersonaId { get; set; }
    public Persona? Persona { get; set; }
    public int DireccionId { get; set; }
    public Direccion? Direccion { get; set; }
    public int DatosEconomicosId { get; set; }
    public DatosEconomicos? DatosEconomicos { get; set; }
    public List<Documento> Documentos { get; set; } = new();
}
