using System.ComponentModel.DataAnnotations;

namespace TramitesApi.DTOs;

public class TramiteCreateForm
{
    [Required, MaxLength(80)] public string Nombre { get; set; } = string.Empty;
    [Required, MaxLength(80)] public string PrimerApellido { get; set; } = string.Empty;
    [MaxLength(80)] public string? SegundoApellido { get; set; }
    [Required, StringLength(18, MinimumLength = 18)] public string Curp { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(120)] public string Correo { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string Telefono { get; set; } = string.Empty;
    [Required] public DateTime? FechaNacimiento { get; set; }
    [Range(1, int.MaxValue)] public int GeneroId { get; set; }

    [Required, MaxLength(120)] public string Calle { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string NumeroExterior { get; set; } = string.Empty;
    [MaxLength(20)] public string? NumeroInterior { get; set; }
    [Required, MaxLength(100)] public string Colonia { get; set; } = string.Empty;
    [Required, RegularExpression(@"^\d{5}$")] public string CodigoPostal { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string MunicipioAlcaldia { get; set; } = string.Empty;
    [Range(1, int.MaxValue)] public int EstadoId { get; set; }

    [Range(1, int.MaxValue)] public int OcupacionId { get; set; }
    [Range(0, 1_000_000_000)] public decimal IngresoMensual { get; set; }
    [Range(0, 50)] public int DependientesEconomicos { get; set; }
    [Required, RegularExpression("^(Propia|Rentada|Familiar)$")] public string SituacionVivienda { get; set; } = string.Empty;

    [Required] public IFormFile? ArchivoPdf { get; set; }
    [Required] public IFormFile? ArchivoTxt { get; set; }
}

public record TramiteResumenDto(
    int Id, string Folio, DateTime FechaRegistro, string Solicitante, string Curp,
    decimal IngresoMensual, bool PdfCargado, bool TxtCargado);

public record TramiteCreadoDto(
    string Folio, DateTime FechaRegistro, string Solicitante, string Curp,
    decimal IngresoMensual, string NombrePdf, string NombreTxt);

public record CatalogosDto(
    IEnumerable<object> Generos, IEnumerable<object> Estados, IEnumerable<object> Ocupaciones);
