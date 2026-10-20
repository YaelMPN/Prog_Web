/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: server/Services/MemoryStore.cs
 * Framework Backend: ASP.NET Core Web API (.NET) - Servicio de Estado en Memoria
 * Rol Arquitectónico: Almacén estático en memoria RAM (List<Movimiento>) que
 * conserva las transacciones, saldo base y notificaciones mientras el servidor
 * ASP.NET Core esté activo y se reinicia al detener el proceso.
 * ============================================================================
 */

using System.Globalization;
using FinanzasApi.Models;

namespace FinanzasApi.Services
{
    public static class MemoryStore
    {
        private static readonly object _lock = new();
        private static decimal _saldoBase = 0m;
        private static readonly List<Movimiento> _movimientos = new();
        private static readonly List<NotificacionItem> _notificaciones = new();
        private static readonly Random _random = new();

        private static readonly List<CategoriaCatalogo> _catalogoCategorias = new()
        {
            // 8 Categorías de Ingreso
            new CategoriaCatalogo { Id = "cat-sueldo", Nombre = "Sueldo", TipoSugerido = "Ingreso", BadgeColor = "#15803D" },
            new CategoriaCatalogo { Id = "cat-inversion", Nombre = "Inversión", TipoSugerido = "Ingreso", BadgeColor = "#00D9FF" },
            new CategoriaCatalogo { Id = "cat-ventas", Nombre = "Ventas / Negocio", TipoSugerido = "Ingreso", BadgeColor = "#15803D" },
            new CategoriaCatalogo { Id = "cat-honorarios", Nombre = "Honorarios / Freelance", TipoSugerido = "Ingreso", BadgeColor = "#0D9488" },
            new CategoriaCatalogo { Id = "cat-bonos", Nombre = "Bonos y Aguinaldo", TipoSugerido = "Ingreso", BadgeColor = "#16A34A" },
            new CategoriaCatalogo { Id = "cat-beca", Nombre = "Beca / Apoyo", TipoSugerido = "Ingreso", BadgeColor = "#0284C7" },
            new CategoriaCatalogo { Id = "cat-reembolsos", Nombre = "Reembolsos", TipoSugerido = "Ingreso", BadgeColor = "#2563EB" },
            new CategoriaCatalogo { Id = "cat-otros-ingresos", Nombre = "Otros (Ingresos)", TipoSugerido = "Ingreso", BadgeColor = "#475569" },

            // 8 Categorías de Egreso
            new CategoriaCatalogo { Id = "cat-alimentos", Nombre = "Alimentos", TipoSugerido = "Egreso", BadgeColor = "#1D4ED8" },
            new CategoriaCatalogo { Id = "cat-transporte", Nombre = "Transporte", TipoSugerido = "Egreso", BadgeColor = "#3B5266" },
            new CategoriaCatalogo { Id = "cat-servicios", Nombre = "Servicios", TipoSugerido = "Egreso", BadgeColor = "#475569" },
            new CategoriaCatalogo { Id = "cat-vivienda", Nombre = "Vivienda / Renta", TipoSugerido = "Egreso", BadgeColor = "#7C3AED" },
            new CategoriaCatalogo { Id = "cat-salud", Nombre = "Salud y Farmacia", TipoSugerido = "Egreso", BadgeColor = "#DC2626" },
            new CategoriaCatalogo { Id = "cat-educacion", Nombre = "Educación", TipoSugerido = "Egreso", BadgeColor = "#2563EB" },
            new CategoriaCatalogo { Id = "cat-ocio", Nombre = "Ocio", TipoSugerido = "Egreso", BadgeColor = "#B91C1C" },
            new CategoriaCatalogo { Id = "cat-otros-gastos", Nombre = "Otros (Gastos)", TipoSugerido = "Egreso", BadgeColor = "#64748B" }
        };

        public static List<CategoriaCatalogo> GetCatalog()
        {
            return _catalogoCategorias.ToList();
        }

        public static bool EsCategoriaValida(string categoria)
        {
            if (string.IsNullOrWhiteSpace(categoria)) return false;
            return _catalogoCategorias.Any(c =>
                string.Equals(c.Nombre, categoria.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        public static List<NotificacionItem> GetNotificaciones()
        {
            lock (_lock)
            {
                return _notificaciones.ToList();
            }
        }

        private static void AddNotificationInternal(string texto)
        {
            var notif = new NotificacionItem
            {
                Id = $"NOTIF-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{_random.Next(10, 99)}",
                Texto = texto,
                Hora = DateTime.Now.ToString("HH:mm", CultureInfo.InvariantCulture)
            };
            _notificaciones.Insert(0, notif);
        }

        private static string FormatCurrency(decimal amount)
        {
            return amount.ToString("C2", new CultureInfo("es-MX"));
        }

        public static Balance SetSaldoBase(decimal nuevoSaldo)
        {
            lock (_lock)
            {
                _saldoBase = nuevoSaldo < 0 ? 0m : decimal.Round(nuevoSaldo, 2);
                int numNotif = _notificaciones.Count + 1;
                AddNotificationInternal(
                    $"Notificación {numNotif}: Saldo inicial actualizado a {FormatCurrency(_saldoBase)}"
                );
                return GetBalanceInternal(_movimientos);
            }
        }

        public static List<Movimiento> GetMovimientos(
            string? tipo = null,
            string? categoria = null,
            string? busqueda = null)
        {
            lock (_lock)
            {
                IEnumerable<Movimiento> query = _movimientos
                    .OrderByDescending(m => m.Fecha)
                    .ThenByDescending(m => m.Timestamp);

                if (!string.IsNullOrWhiteSpace(tipo) &&
                    !string.Equals(tipo, "TODOS", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(m =>
                        string.Equals(m.Tipo, tipo, StringComparison.OrdinalIgnoreCase));
                }

                if (!string.IsNullOrWhiteSpace(categoria) &&
                    !string.Equals(categoria, "TODAS", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(m =>
                        string.Equals(m.Categoria, categoria, StringComparison.OrdinalIgnoreCase));
                }

                if (!string.IsNullOrWhiteSpace(busqueda))
                {
                    string q = busqueda.Trim().ToLowerInvariant();
                    query = query.Where(m =>
                        m.Descripcion.ToLowerInvariant().Contains(q) ||
                        m.Categoria.ToLowerInvariant().Contains(q) ||
                        m.Id.ToLowerInvariant().Contains(q));
                }

                return query.ToList();
            }
        }

        public static Movimiento AddMovimiento(CrearMovimientoRequest req)
        {
            lock (_lock)
            {
                string tipoLimpio = string.Equals(req.Tipo, "Egreso", StringComparison.OrdinalIgnoreCase)
                    ? "Egreso"
                    : "Ingreso";

                var nuevo = new Movimiento
                {
                    Id = $"MOV-{_random.Next(1000, 9999)}",
                    Tipo = tipoLimpio,
                    Monto = decimal.Round(req.Monto, 2),
                    Categoria = req.Categoria.Trim(),
                    Fecha = req.Fecha.Trim(),
                    Descripcion = req.Descripcion.Trim(),
                    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };

                _movimientos.Insert(0, nuevo);

                string signo = nuevo.Tipo == "Ingreso" ? "+" : "-";
                int numNotif = _notificaciones.Count + 1;
                AddNotificationInternal(
                    $"Notificación {numNotif}: {nuevo.Tipo} registrado ({nuevo.Categoria}) por {signo}{FormatCurrency(nuevo.Monto)}"
                );

                return nuevo;
            }
        }

        public static bool DeleteMovimiento(string id)
        {
            lock (_lock)
            {
                var existente = _movimientos.FirstOrDefault(m =>
                    string.Equals(m.Id, id, StringComparison.OrdinalIgnoreCase));

                if (existente == null)
                {
                    return false;
                }

                _movimientos.Remove(existente);
                int numNotif = _notificaciones.Count + 1;
                AddNotificationInternal(
                    $"Notificación {numNotif}: Movimiento eliminado ({existente.Categoria})"
                );
                return true;
            }
        }

        public static Balance GetBalance(IEnumerable<Movimiento>? listaEspecifica = null)
        {
            lock (_lock)
            {
                return GetBalanceInternal(listaEspecifica ?? _movimientos);
            }
        }

        private static Balance GetBalanceInternal(IEnumerable<Movimiento> source)
        {
            var lista = source.ToList();
            var ingresos = lista.Where(m => m.Tipo == "Ingreso").ToList();
            var egresos = lista.Where(m => m.Tipo == "Egreso").ToList();

            decimal totalIngresos = decimal.Round(ingresos.Sum(m => m.Monto), 2);
            decimal totalEgresos = decimal.Round(egresos.Sum(m => m.Monto), 2);
            decimal balanceNetoMes = decimal.Round(totalIngresos - totalEgresos, 2);
            decimal saldoActual = decimal.Round(_saldoBase + balanceNetoMes, 2);

            decimal volumen = totalIngresos + totalEgresos;
            int pctIngresos = volumen > 0
                ? (int)Math.Round((totalIngresos / volumen) * 100m, MidpointRounding.AwayFromZero)
                : 0;
            int pctEgresos = volumen > 0 ? 100 - pctIngresos : 0;

            return new Balance
            {
                SaldoBase = _saldoBase,
                TotalIngresos = totalIngresos,
                TotalEgresos = totalEgresos,
                BalanceNetoMes = balanceNetoMes,
                SaldoActual = saldoActual,
                ConteoIngresos = ingresos.Count,
                ConteoEgresos = egresos.Count,
                TotalMovimientos = lista.Count,
                PorcentajeIngresos = pctIngresos,
                PorcentajeEgresos = pctEgresos
            };
        }

        public static List<DesgloseCategoria> GetDesgloseCategorias()
        {
            lock (_lock)
            {
                var mapa = new Dictionary<string, DesgloseCategoria>(StringComparer.OrdinalIgnoreCase);

                foreach (var cat in _catalogoCategorias)
                {
                    mapa[cat.Nombre] = new DesgloseCategoria
                    {
                        Id = cat.Id,
                        Categoria = cat.Nombre,
                        TipoSugerido = cat.TipoSugerido,
                        BadgeColor = cat.BadgeColor,
                        TotalIngresos = 0m,
                        TotalEgresos = 0m,
                        Cantidad = 0
                    };
                }

                foreach (var tx in _movimientos)
                {
                    if (!mapa.TryGetValue(tx.Categoria, out var item))
                    {
                        item = new DesgloseCategoria
                        {
                            Id = "cat-custom",
                            Categoria = tx.Categoria,
                            TipoSugerido = tx.Tipo,
                            BadgeColor = "#3B5266",
                            TotalIngresos = 0m,
                            TotalEgresos = 0m,
                            Cantidad = 0
                        };
                        mapa[tx.Categoria] = item;
                    }

                    if (tx.Tipo == "Ingreso")
                    {
                        item.TotalIngresos = decimal.Round(item.TotalIngresos + tx.Monto, 2);
                    }
                    else
                    {
                        item.TotalEgresos = decimal.Round(item.TotalEgresos + tx.Monto, 2);
                    }

                    item.Cantidad += 1;
                }

                return mapa.Values.ToList();
            }
        }

        public static MetaAhorro CalcularMetaAhorro(MetaAhorroRequest req)
        {
            lock (_lock)
            {
                var balanceActual = GetBalanceInternal(_movimientos);

                decimal metaNum = Math.Max(0m, decimal.Round(req.MontoObjetivo, 2));
                int mesesNum = Math.Max(1, req.PlazoMeses);

                decimal saldoDisponible = Math.Max(0m, balanceActual.SaldoActual);
                decimal flujoMensualNeto = balanceActual.BalanceNetoMes;

                decimal capitalInicialAplicado = req.UsarSaldoActual
                    ? Math.Min(metaNum, saldoDisponible)
                    : 0m;

                decimal montoRestante = Math.Max(0m, metaNum - capitalInicialAplicado);
                decimal cuotaMensual = mesesNum > 0
                    ? decimal.Round(montoRestante / mesesNum, 2)
                    : montoRestante;

                bool cubiertaPorSaldoActual = metaNum > 0 && saldoDisponible >= metaNum;
                bool cubiertaPorFlujoMensual = metaNum > 0 &&
                    (montoRestante == 0m || flujoMensualNeto >= cuotaMensual);

                decimal diferenciaFlujo = decimal.Round(flujoMensualNeto - cuotaMensual, 2);

                int pctCoberturaSaldo = metaNum > 0
                    ? (int)Math.Min(100m, Math.Round((saldoDisponible / metaNum) * 100m))
                    : 0;

                int pctCoberturaFlujo = cuotaMensual > 0
                    ? (int)Math.Min(100m, Math.Max(0m, Math.Round((flujoMensualNeto / cuotaMensual) * 100m)))
                    : (metaNum > 0 ? 100 : 0);

                decimal[] fracciones = { 0.25m, 0.50m, 0.75m, 1.00m };
                var hitos = fracciones.Select(fraccion =>
                {
                    int mesHito = Math.Max(1, (int)Math.Round(mesesNum * fraccion, MidpointRounding.AwayFromZero));
                    decimal ahorroAcumulado = decimal.Round(capitalInicialAplicado + (montoRestante * fraccion), 2);
                    return new HitoProyeccionAhorro
                    {
                        Etapa = $"{(int)Math.Round(fraccion * 100m)}%",
                        Mes = $"Mes {mesHito}",
                        Monto = ahorroAcumulado
                    };
                }).ToList();

                return new MetaAhorro
                {
                    Id = $"META-{_random.Next(1000, 9999)}",
                    Nombre = string.IsNullOrWhiteSpace(req.Nombre) ? "Meta de Ahorro" : req.Nombre.Trim(),
                    MontoObjetivo = metaNum,
                    PlazoMeses = mesesNum,
                    UsarSaldoActual = req.UsarSaldoActual,
                    SaldoDisponible = saldoDisponible,
                    FlujoMensualNeto = flujoMensualNeto,
                     CapitalInicialAplicado = capitalInicialAplicado,
                    MontoRestante = montoRestante,
                    CuotaMensualRequerida = cuotaMensual,
                    CubiertaPorSaldoActual = cubiertaPorSaldoActual,
                    CubiertaPorFlujoMensual = cubiertaPorFlujoMensual,
                    DiferenciaFlujoMensual = diferenciaFlujo,
                    PorcentajeCoberturaSaldo = pctCoberturaSaldo,
                    PorcentajeCoberturaFlujo = pctCoberturaFlujo,
                    Hitos = hitos
                };
            }
        }
    }
}

