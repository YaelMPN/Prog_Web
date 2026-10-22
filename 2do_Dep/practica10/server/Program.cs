/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: server/Program.cs
 * Framework Backend: ASP.NET Core Web API (.NET 8) + Entity Framework Core SQLite
 * Rol Arquitectónico: Inicializa el host de ASP.NET Core, registra el contexto
 * relacional normalizado en 3FN (`FinanzasDbContext` apuntando a `finanzas.db`),
 * ejecuta `db.Database.EnsureCreated()` al arrancar (creando las 7 tablas si no
 * existen y aplicando el Data Seeding de `TiposMovimiento` y `Categorias`),
 * configura la serialización JSON (camelCase) y habilita CORS + escucha en
 * `http://0.0.0.0:5000` para acceso desde PC, red local Wi-Fi o cable USB.
 * ============================================================================
 */

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using FinanzasApi.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Registro de Entity Framework Core con SQLite (Base de Datos Normalizada hasta 3FN)
builder.Services.AddDbContext<FinanzasDbContext>(options =>
    options.UseSqlite("Data Source=finanzas.db"));

// 2. Registro de Controladores MVC con serialización camelCase compatible con React/TypeScript
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    });

// 3. Configuración de política CORS abierta para desarrollo con Vite / React (PC y Móvil)
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClientPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 4. Escucha en todas las interfaces (0.0.0.0:5000) para funcionar en localhost, Wi-Fi y cable USB
builder.WebHost.UseUrls("http://0.0.0.0:5000");

var app = builder.Build();

// 5. Inicialización automática de la Base de Datos SQLite (solo crea las tablas si no existen)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FinanzasDbContext>();
    db.Database.EnsureCreated();
}

app.UseCors("ReactClientPolicy");

app.MapControllers();

app.MapGet("/", () => Results.Ok(new
{
    servicio = "YaFinanzas MVC - ASP.NET Core Web API (.NET 8) + SQLite (3FN)",
    estado = "Activo",
    endpoints = new[]
    {
        "POST   /api/finanzas/auth/registro",
        "POST   /api/finanzas/auth/login",
        "GET    /api/finanzas/balance?usuarioId={id}",
        "PUT    /api/finanzas/balance",
        "GET    /api/finanzas/movimientos?usuarioId={id}",
        "POST   /api/finanzas/movimientos",
        "DELETE /api/finanzas/movimientos/{id}?usuarioId={id}",
        "GET    /api/finanzas/metas?usuarioId={id}",
        "POST   /api/finanzas/metas/calcular",
        "DELETE /api/finanzas/metas/{id}?usuarioId={id}"
    }
}));

app.Run();
