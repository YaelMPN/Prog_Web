using System.ComponentModel.DataAnnotations;

namespace TramitesApi.Models;

public class Genero
{
    public int Id { get; set; }
    [Required, MaxLength(40)] public string Nombre { get; set; } = string.Empty;
}

public class Estado
{
    public int Id { get; set; }
    [Required, MaxLength(60)] public string NombreEstado { get; set; } = string.Empty;
    [Required, MaxLength(5)] public string Clave { get; set; } = string.Empty;
}

public class Ocupacion
{
    public int Id { get; set; }
    [Required, MaxLength(60)] public string Titulo { get; set; } = string.Empty;
}
