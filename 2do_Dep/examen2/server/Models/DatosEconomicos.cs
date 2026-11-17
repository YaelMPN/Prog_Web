using System.ComponentModel.DataAnnotations;

namespace TramitesApi.Models;

public class DatosEconomicos
{
    public int Id { get; set; }
    public int OcupacionId { get; set; }
    public Ocupacion? Ocupacion { get; set; }
    public decimal IngresoMensual { get; set; }
    public int DependientesEconomicos { get; set; }
    [Required, MaxLength(20)] public string SituacionVivienda { get; set; } = string.Empty;
}
