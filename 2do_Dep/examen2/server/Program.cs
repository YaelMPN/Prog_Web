using Microsoft.EntityFrameworkCore;
using TramitesApi.Context;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<TramitesDbContext>(o => o.UseSqlite("Data Source=tramites.db"));
builder.Services.AddControllers();
builder.Services.AddCors(o => o.AddPolicy("Frontend", p => p
    .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TramitesDbContext>();
    db.Database.EnsureCreated();
    TramitesDbContext.Sembrar(db);
}

app.UseCors("Frontend");
app.MapControllers();

app.Run();
