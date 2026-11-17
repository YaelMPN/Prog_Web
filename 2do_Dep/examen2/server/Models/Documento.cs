using System.ComponentModel.DataAnnotations;

namespace TramitesApi.Models;

public class Documento
{
    public int Id { get; set; }
    public int TramiteId { get; set; }
    public Tramite? Tramite { get; set; }
    [Required, MaxLength(10)] public string TipoDocumento { get; set; } = string.Empty;
    [Required, MaxLength(255)] public string NombreOriginal { get; set; } = string.Empty;
    [Required, MaxLength(10)] public string Extension { get; set; } = string.Empty;
    public long TamanoBytes { get; set; }
    public byte[] ArchivoBytes { get; set; } = Array.Empty<byte>();
    public DateTime FechaCarga { get; set; }
}
