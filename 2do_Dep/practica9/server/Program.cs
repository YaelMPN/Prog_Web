/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: server/Program.cs
 * Framework Backend: ASP.NET Core Web API (.NET) - Punto de Entrada (MVC)
 * Rol Arquitectónico: Inicializa el host de ASP.NET Core, registra los
 * controladores MVC, configura la serialización JSON (camelCase) y habilita la
 * política de CORS para permitir peticiones desde el cliente React + TypeScript.
 * ============================================================================
 */

using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// 1. Registro de Controladores MVC con serialización camelCase compatible con React/TypeScript
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    });

// 2. Configuración de política CORS abierta para desarrollo con Vite / React
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClientPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 3. Puerto predeterminado http://localhost:5000 si no se especifica por entorno
builder.WebHost.UseUrls("http://localhost:5000");

var app = builder.Build();

app.UseCors("ReactClientPolicy");

app.MapControllers();

app.MapGet("/", () => Results.Ok(new
{
    servicio = "Finanzas MVC - ASP.NET Core Web API (.NET)",
    estado = "Activo",
    endpoints = new[]
    {
        "GET    /api/finanzas/balance",
        "PUT    /api/finanzas/balance",
        "GET    /api/finanzas/movimientos",
        "POST   /api/finanzas/movimientos",
        "DELETE /api/finanzas/movimientos/{id}",
        "POST   /api/finanzas/metas/calcular"
    }
}));

app.Run();

