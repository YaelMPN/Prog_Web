using System.ComponentModel.DataAnnotations;

namespace TramitesApi.Models;

public class Direccion
{
    public int Id { get; set; }
    [Required, MaxLength(120)] public string Calle { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string NumeroExterior { get; set; } = string.Empty;
    [MaxLength(20)] public string? NumeroInterior { get; set; }
    [Required, MaxLength(100)] public string Colonia { get; set; } = string.Empty;
    [Required, MaxLength(5)] public string CodigoPostal { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string MunicipioAlcaldia { get; set; } = string.Empty;
    public int EstadoId { get; set; }
    public Estado? Estado { get; set; }
}
