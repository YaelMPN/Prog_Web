using System.ComponentModel.DataAnnotations;

namespace TramitesApi.Models;

public class Persona
{
    public int Id { get; set; }
    [Required, MaxLength(80)] public string Nombre { get; set; } = string.Empty;
    [Required, MaxLength(80)] public string PrimerApellido { get; set; } = string.Empty;
    [MaxLength(80)] public string? SegundoApellido { get; set; }
    [Required, StringLength(18, MinimumLength = 18)] public string CURP { get; set; } = string.Empty;
    [Required, MaxLength(120)] public string Correo { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string Telefono { get; set; } = string.Empty;
    public DateTime FechaNacimiento { get; set; }
    public int GeneroId { get; set; }
    public Genero? Genero { get; set; }
}
