/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES - PRÁCTICA 10
 * Archivo: server/Controllers/FinanzasController.cs
 * Framework Backend: ASP.NET Core Web API (.NET 8) + Entity Framework Core SQLite
 * Rol Arquitectónico: Controlador RESTful ([ApiController]) que gestiona la
 * autenticación de usuarios, configuración de presupuesto, movimientos,
 * metas de ahorro y notificaciones sobre la base de datos SQLite normalizada
 * hasta la Tercera Forma Normal (3FN).
 *
 * CUMPLIMIENTO 3FN EN CONSULTAS Y PROYECCIONES:
 * - Las transacciones en `Movimientos` se consultan mediante Eager Loading:
 *   `.Include(m => m.Categoria).ThenInclude(c => c.TipoMovimiento)` para
 *   obtener el nombre de la categoría y el tipo ('Ingreso'/'Egreso') sin
 *   almacenar strings redundantes en la tabla de hechos.
 * - Las metas en `MetasAhorro` persisten solo (`Nombre`, `MontoObjetivo`,
 *   `PlazoMeses`); la cuota mensual requerida y el análisis de viabilidad se
 *   calculan dinámicamente en `ProyectarMetaAhorro()` al construir el DTO.
 * ============================================================================
 */

using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanzasApi.Data;
using FinanzasApi.Models;

namespace FinanzasApi.Controllers
{
    [ApiController]
    [Route("api/finanzas")]
    public class FinanzasController : ControllerBase
    {
        private readonly FinanzasDbContext _db;

        public FinanzasController(FinanzasDbContext db)
        {
            _db = db;
        }

        private static string FormatCurrency(decimal amount)
        {
            return amount.ToString("C2", new CultureInfo("es-MX"));
        }

        /// <summary>
        /// Obtiene el catálogo oficial de 16 categorías desde SQLite haciendo JOIN con TiposMovimiento (3FN).
        /// </summary>
        private async Task<List<CategoriaCatalogo>> GetCatalogAsync()
        {
            var categoriasDb = await _db.Categorias
                .AsNoTracking()
                .Include(c => c.TipoMovimiento)
                .OrderBy(c => c.Id)
                .ToListAsync();

            return categoriasDb.Select(c => new CategoriaCatalogo
            {
                Id = $"cat-{c.Id}",
                CategoriaId = c.Id,
                Nombre = c.Nombre,
                TipoSugerido = c.TipoMovimiento?.Nombre ?? "Ingreso"
            }).ToList();
        }

        /// <summary>
        /// Obtiene o inicializa la fila de ConfiguracionesPresupuesto (Relación 1:1 en 3FN) para un usuario.
        /// </summary>
        private async Task<ConfiguracionPresupuesto> GetOrCreatePresupuestoAsync(int usuarioId)
        {
            var config = await _db.ConfiguracionesPresupuesto
                .FirstOrDefaultAsync(cp => cp.UsuarioId == usuarioId);

            if (config == null && usuarioId > 0)
            {
                bool existeUsuario = await _db.Usuarios.AnyAsync(u => u.Id == usuarioId);
                if (existeUsuario)
                {
                    config = new ConfiguracionPresupuesto
                    {
                        UsuarioId = usuarioId,
                        SaldoInicial = 0m,
                        LimiteMensual = 0m
                    };
                    _db.ConfiguracionesPresupuesto.Add(config);
                    await _db.SaveChangesAsync();
                }
            }

            return config ?? new ConfiguracionPresupuesto
            {
                UsuarioId = usuarioId,
                SaldoInicial = 0m,
                LimiteMensual = 0m
            };
        }

        /// <summary>
        /// Consulta los movimientos del usuario aplicando JOIN (.Include -> .ThenInclude) conforme a 3FN.
        /// </summary>
        private async Task<List<Movimiento>> GetMovimientosUsuarioAsync(int usuarioId)
        {
            if (usuarioId <= 0)
            {
                return new List<Movimiento>();
            }

            var entidades = await _db.Movimientos
                .AsNoTracking()
                .Include(m => m.Categoria)
                    .ThenInclude(c => c!.TipoMovimiento)
                .Where(m => m.UsuarioId == usuarioId)
                .OrderByDescending(m => m.Fecha)
                .ThenByDescending(m => m.Id)
                .ToListAsync();

            return entidades.Select(m => new Movimiento
            {
                Id = $"MOV-{m.Id}",
                Tipo = m.Categoria?.TipoMovimiento?.Nombre ?? "Ingreso",
                Monto = m.Monto,
                Categoria = m.Categoria?.Nombre ?? "Otros",
                Fecha = m.Fecha,
                Descripcion = m.Descripcion,
                Timestamp = m.Timestamp
            }).ToList();
        }

        /// <summary>
        /// Consulta las notificaciones del usuario ordenadas de la más reciente a la más antigua.
        /// </summary>
        private async Task<List<NotificacionItem>> GetNotificacionesUsuarioAsync(int usuarioId)
        {
            if (usuarioId <= 0)
            {
                return new List<NotificacionItem>();
            }

            var lista = await _db.Notificaciones
                .AsNoTracking()
                .Where(n => n.UsuarioId == usuarioId)
                .OrderByDescending(n => n.Id)
                .ToListAsync();

            return lista.Select(n => new NotificacionItem
            {
                Id = $"NOTIF-{n.Id}",
                Texto = n.Texto,
                Hora = n.Hora,
                Leida = n.Leida
            }).ToList();
        }

        /// <summary>
        /// Registra una nueva notificación persistente en la tabla Notificaciones para el usuario.
        /// </summary>
        private async Task AddNotificacionUsuarioAsync(int usuarioId, string detalleMensaje)
        {
            if (usuarioId <= 0) return;

            int conteoActual = await _db.Notificaciones.CountAsync(n => n.UsuarioId == usuarioId);
            int numNotif = conteoActual + 1;

            var nueva = new NotificacionEntity
            {
                UsuarioId = usuarioId,
                Texto = $"Notificación {numNotif}: {detalleMensaje}",
                Hora = DateTime.Now.ToString("HH:mm", CultureInfo.InvariantCulture),
                Leida = false
            };

            _db.Notificaciones.Add(nueva);
            await _db.SaveChangesAsync();
        }

        /// <summary>
        /// Calcula en memoria el DTO Balance (3FN: ninguna columna calculada se persiste en SQLite).
        /// </summary>
        private static Balance CalcularBalanceDTO(
            decimal saldoInicial,
            decimal limiteMensual,
            IEnumerable<Movimiento> source)
        {
            var lista = source.ToList();
            var ingresos = lista.Where(m => m.Tipo == "Ingreso").ToList();
            var egresos = lista.Where(m => m.Tipo == "Egreso").ToList();

            decimal totalIngresos = decimal.Round(ingresos.Sum(m => m.Monto), 2);
            decimal totalEgresos = decimal.Round(egresos.Sum(m => m.Monto), 2);
            decimal balanceNetoMes = decimal.Round(totalIngresos - totalEgresos, 2);
            decimal saldoActual = decimal.Round(saldoInicial + balanceNetoMes, 2);

            decimal volumen = totalIngresos + totalEgresos;
            int pctIngresos = volumen > 0
                ? (int)Math.Round((totalIngresos / volumen) * 100m, MidpointRounding.AwayFromZero)
                : 0;
            int pctEgresos = volumen > 0 ? 100 - pctIngresos : 0;

            return new Balance
            {
                SaldoBase = saldoInicial,
                LimiteMensual = limiteMensual,
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

        /// <summary>
        /// Construye el desglose analítico por categoría combinando el catálogo 3FN y los movimientos del usuario.
        /// </summary>
        private static List<DesgloseCategoria> CalcularDesgloseCategorias(
            List<CategoriaCatalogo> catalogo,
            IEnumerable<Movimiento> movimientos)
        {
            var mapa = new Dictionary<string, DesgloseCategoria>(StringComparer.OrdinalIgnoreCase);

            foreach (var cat in catalogo)
            {
                mapa[cat.Nombre] = new DesgloseCategoria
                {
                    Id = cat.Id,
                    Categoria = cat.Nombre,
                    TipoSugerido = cat.TipoSugerido,
                    TotalIngresos = 0m,
                    TotalEgresos = 0m,
                    Cantidad = 0
                };
            }

            foreach (var tx in movimientos)
            {
                if (!mapa.TryGetValue(tx.Categoria, out var item))
                {
                    item = new DesgloseCategoria
                    {
                        Id = "cat-custom",
                        Categoria = tx.Categoria,
                        TipoSugerido = tx.Tipo,
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

        /// <summary>
        /// Calcula dinámicamente la cuota mensual requerida y la viabilidad de una meta (Cumplimiento estricto 3FN).
        /// </summary>
        private static MetaAhorro ProyectarMetaAhorro(
            int idEntidad,
            string nombre,
            decimal montoObjetivo,
            int plazoMeses,
            bool usarSaldoActual,
            Balance balanceActual)
        {
            decimal metaNum = Math.Max(0m, decimal.Round(montoObjetivo, 2));
            int mesesNum = Math.Max(1, plazoMeses);

            decimal saldoDisponible = Math.Max(0m, balanceActual.SaldoActual);
            decimal flujoMensualNeto = balanceActual.BalanceNetoMes;

            decimal capitalInicialAplicado = usarSaldoActual
                ? Math.Min(metaNum, saldoDisponible)
                : 0m;

            decimal montoRestante = Math.Max(0m, metaNum - capitalInicialAplicado);
            decimal cuotaMensual = mesesNum > 0
                ? decimal.Round(montoRestante / mesesNum, 2)
                : montoRestante;

            bool cubiertaPorSaldoActual = metaNum > 0 && saldoDisponible >= metaNum;
            bool cubiertaPorFlujoMensual = metaNum > 0 &&
                (montoRestante == 0m || flujoMensualNeto >= cuotaMensual);
            bool viable = cubiertaPorSaldoActual || cubiertaPorFlujoMensual;

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
                Id = $"META-{idEntidad}",
                NumericId = idEntidad,
                Nombre = string.IsNullOrWhiteSpace(nombre) ? "Meta de Ahorro" : nombre.Trim(),
                MontoObjetivo = metaNum,
                PlazoMeses = mesesNum,
                UsarSaldoActual = usarSaldoActual,
                SaldoDisponible = saldoDisponible,
                FlujoMensualNeto = flujoMensualNeto,
                CapitalInicialAplicado = capitalInicialAplicado,
                MontoRestante = montoRestante,
                CuotaMensualRequerida = cuotaMensual,
                CubiertaPorSaldoActual = cubiertaPorSaldoActual,
                CubiertaPorFlujoMensual = cubiertaPorFlujoMensual,
                Viable = viable,
                DiferenciaFlujoMensual = diferenciaFlujo,
                PorcentajeCoberturaSaldo = pctCoberturaSaldo,
                PorcentajeCoberturaFlujo = pctCoberturaFlujo,
                Hitos = hitos
            };
        }

        /// <summary>
        /// Obtiene todas las metas guardadas del usuario y calcula sus proyecciones 3FN.
        /// </summary>
        private async Task<List<MetaAhorro>> GetMetasUsuarioAsync(int usuarioId, Balance balanceActual)
        {
            if (usuarioId <= 0)
            {
                return new List<MetaAhorro>();
            }

            var entidades = await _db.MetasAhorro
                .AsNoTracking()
                .Where(m => m.UsuarioId == usuarioId)
                .OrderByDescending(m => m.Id)
                .ToListAsync();

            return entidades.Select(m => ProyectarMetaAhorro(
                m.Id,
                m.Nombre,
                m.MontoObjetivo,
                m.PlazoMeses,
                false,
                balanceActual
            )).ToList();
        }

        /// <summary>
        /// Construye el payload sincronizado completo para el frontend React + TypeScript.
        /// </summary>
        private async Task<object> BuildStatePayloadAsync(int usuarioId, object? extra = null)
        {
            var catalogo = await GetCatalogAsync();
            var presupuesto = await GetOrCreatePresupuestoAsync(usuarioId);
            var movimientos = await GetMovimientosUsuarioAsync(usuarioId);
            var balance = CalcularBalanceDTO(presupuesto.SaldoInicial, presupuesto.LimiteMensual, movimientos);
            var desglose = CalcularDesgloseCategorias(catalogo, movimientos);
            var notificaciones = await GetNotificacionesUsuarioAsync(usuarioId);
            var metas = await GetMetasUsuarioAsync(usuarioId, balance);

            return new
            {
                ok = true,
                balance,
                transacciones = movimientos,
                desgloseCategorias = desglose,
                notificaciones,
                categorias = catalogo,
                metas,
                detalle = extra
            };
        }

        // =========================================================================
        // 1. ENDPOINTS DE AUTENTICACIÓN (REGISTRO Y LOGIN)
        // =========================================================================

        /// <summary>
        /// POST /api/finanzas/auth/registro
        /// Registra un nuevo usuario en `Usuarios` y su configuración inicial en `ConfiguracionesPresupuesto` (3FN).
        /// </summary>
        [HttpPost("auth/registro")]
        public async Task<IActionResult> RegistrarUsuario([FromBody] RegistroUsuarioRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Nombre) || request.Nombre.Trim().Length < 2)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Nombre requerido",
                    message = "Ingresa tu nombre completo (mínimo 2 caracteres)."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Correo inválido",
                    message = "Ingresa una dirección de correo electrónico válida."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 4)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Contraseña inválida",
                    message = "La contraseña debe contener al menos 4 caracteres."
                });
            }

            if (request.SaldoInicial < 0)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Saldo inicial inválido",
                    message = "El saldo inicial debe ser $0.00 o un monto positivo."
                });
            }

            string emailNormalizado = request.Email.Trim().ToLowerInvariant();
            bool existeCorreo = await _db.Usuarios.AnyAsync(u => u.Email.ToLower() == emailNormalizado);
            if (existeCorreo)
            {
                return Conflict(new
                {
                    ok = false,
                    titulo = "Correo ya registrado",
                    message = "Ya existe una cuenta registrada con ese correo electrónico. Inicia sesión o utiliza otro correo."
                });
            }

            decimal saldoInicialLimpio = decimal.Round(Math.Max(0m, request.SaldoInicial), 2);
            decimal limiteMensualLimpio = decimal.Round(Math.Max(0m, request.LimiteMensual), 2);

            var nuevoUsuario = new Usuario
            {
                Nombre = request.Nombre.Trim(),
                Email = emailNormalizado,
                Password = request.Password,
                AvatarDataUrl = request.AvatarDataUrl ?? string.Empty,
                FechaRegistro = DateTime.UtcNow
            };

            _db.Usuarios.Add(nuevoUsuario);
            await _db.SaveChangesAsync();

            var configPresupuesto = new ConfiguracionPresupuesto
            {
                UsuarioId = nuevoUsuario.Id,
                SaldoInicial = saldoInicialLimpio,
                LimiteMensual = limiteMensualLimpio
            };

            _db.ConfiguracionesPresupuesto.Add(configPresupuesto);
            await _db.SaveChangesAsync();

            await AddNotificacionUsuarioAsync(
                nuevoUsuario.Id,
                $"Bienvenido(a) {nuevoUsuario.Nombre}. Cuenta creada con saldo inicial de {FormatCurrency(saldoInicialLimpio)}"
            );

            var usuarioDto = new UsuarioDTO
            {
                Id = nuevoUsuario.Id,
                Nombre = nuevoUsuario.Nombre,
                Email = nuevoUsuario.Email,
                AvatarDataUrl = nuevoUsuario.AvatarDataUrl,
                SaldoInicial = configPresupuesto.SaldoInicial,
                LimiteMensual = configPresupuesto.LimiteMensual
            };

            var estado = await BuildStatePayloadAsync(nuevoUsuario.Id);

            return Created($"/api/finanzas/usuarios/{nuevoUsuario.Id}", new
            {
                ok = true,
                usuario = usuarioDto,
                estado
            });
        }

        /// <summary>
        /// POST /api/finanzas/auth/login
        /// Autentica un usuario contra la tabla `Usuarios` y carga su configuración 3FN.
        /// </summary>
        [HttpPost("auth/login")]
        public async Task<IActionResult> LoginUsuario([FromBody] LoginUsuarioRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Datos incompletos",
                    message = "Por favor ingresa tu correo electrónico y contraseña para iniciar sesión."
                });
            }

            string emailNormalizado = request.Email.Trim().ToLowerInvariant();
            var usuario = await _db.Usuarios
                .Include(u => u.ConfiguracionPresupuesto)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);

            if (usuario == null)
            {
                return NotFound(new
                {
                    ok = false,
                    codigo = "USUARIO_NO_ENCONTRADO",
                    titulo = "Cuenta no encontrada",
                    message = "No existe ninguna cuenta registrada con ese correo electrónico. Crea una cuenta para comenzar."
                });
            }

            if (usuario.Password != request.Password)
            {
                return Unauthorized(new
                {
                    ok = false,
                    codigo = "PASSWORD_INCORRECTO",
                    titulo = "Contraseña incorrecta",
                    message = "La contraseña ingresada es incorrecta. Verifica tus credenciales e inténtalo de nuevo."
                });
            }

            var presupuesto = usuario.ConfiguracionPresupuesto ?? await GetOrCreatePresupuestoAsync(usuario.Id);

            var usuarioDto = new UsuarioDTO
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Email = usuario.Email,
                AvatarDataUrl = usuario.AvatarDataUrl,
                SaldoInicial = presupuesto.SaldoInicial,
                LimiteMensual = presupuesto.LimiteMensual
            };

            var estado = await BuildStatePayloadAsync(usuario.Id);

            return Ok(new
            {
                ok = true,
                usuario = usuarioDto,
                estado
            });
        }

        // =========================================================================
        // 2. ENDPOINTS DE BALANCE Y CONFIGURACIONES DE PRESUPUESTO (3FN)
        // =========================================================================

        /// <summary>
        /// GET /api/finanzas/balance?usuarioId={id}
        /// Devuelve el balance actual, configuración de presupuesto, movimientos, categorías, metas y notificaciones del usuario.
        /// </summary>
        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance([FromQuery] int usuarioId = 0)
        {
            var payload = await BuildStatePayloadAsync(usuarioId);
            return Ok(payload);
        }

        /// <summary>
        /// PUT /api/finanzas/balance
        /// Actualiza el SaldoInicial y/o LimiteMensual en la tabla ConfiguracionesPresupuesto (3FN).
        /// </summary>
        [HttpPut("balance")]
        public async Task<IActionResult> UpdateSaldoBase([FromBody] ActualizarSaldoBaseRequest request)
        {
            if (request == null || request.SaldoBase < 0)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Saldo inválido",
                    message = "El saldo inicial debe ser $0.00 o una cantidad positiva."
                });
            }

            if (request.LimiteMensual.HasValue && request.LimiteMensual.Value < 0)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Límite mensual inválido",
                    message = "El límite de gasto mensual debe ser $0.00 o una cantidad positiva."
                });
            }

            var config = await GetOrCreatePresupuestoAsync(request.UsuarioId);
            config.SaldoInicial = decimal.Round(request.SaldoBase, 2);

            if (request.LimiteMensual.HasValue)
            {
                config.LimiteMensual = decimal.Round(request.LimiteMensual.Value, 2);
            }

            if (request.UsuarioId > 0)
            {
                _db.ConfiguracionesPresupuesto.Update(config);
                await _db.SaveChangesAsync();

                string msgNotif = config.LimiteMensual > 0
                    ? $"Presupuesto actualizado: Saldo inicial {FormatCurrency(config.SaldoInicial)} | Límite mensual {FormatCurrency(config.LimiteMensual)}"
                    : $"Saldo inicial actualizado a {FormatCurrency(config.SaldoInicial)}";

                await AddNotificacionUsuarioAsync(request.UsuarioId, msgNotif);
            }

            var payload = await BuildStatePayloadAsync(request.UsuarioId);
            return Ok(payload);
        }

        // =========================================================================
        // 3. ENDPOINTS DE MOVIMIENTOS Y REPORTERÍA (3FN CON INCLUDE/THENINCLUDE)
        // =========================================================================

        /// <summary>
        /// GET /api/finanzas/movimientos?usuarioId={id}&tipo=...&categoria=...&busqueda=...
        /// Obtiene el listado de transacciones registradas del usuario filtradas mediante JOIN 3FN.
        /// </summary>
        [HttpGet("movimientos")]
        public async Task<IActionResult> GetMovimientos(
            [FromQuery] int usuarioId = 0,
            [FromQuery] string? tipo = "TODOS",
            [FromQuery] string? categoria = "TODAS",
            [FromQuery] string? busqueda = "")
        {
            var catalogo = await GetCatalogAsync();
            var presupuesto = await GetOrCreatePresupuestoAsync(usuarioId);
            var todas = await GetMovimientosUsuarioAsync(usuarioId);

            IEnumerable<Movimiento> query = todas;

            if (!string.IsNullOrWhiteSpace(tipo) &&
                !string.Equals(tipo, "TODOS", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(m => string.Equals(m.Tipo, tipo, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(categoria) &&
                !string.Equals(categoria, "TODAS", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(m => string.Equals(m.Categoria, categoria, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(busqueda))
            {
                string q = busqueda.Trim().ToLowerInvariant();
                query = query.Where(m =>
                    m.Descripcion.ToLowerInvariant().Contains(q) ||
                    m.Categoria.ToLowerInvariant().Contains(q) ||
                    m.Id.ToLowerInvariant().Contains(q));
            }

            var filtradas = query.ToList();
            var balanceGeneral = CalcularBalanceDTO(presupuesto.SaldoInicial, presupuesto.LimiteMensual, todas);
            var balanceFiltrado = CalcularBalanceDTO(presupuesto.SaldoInicial, presupuesto.LimiteMensual, filtradas);
            var desglose = CalcularDesgloseCategorias(catalogo, todas);
            var notificaciones = await GetNotificacionesUsuarioAsync(usuarioId);
            var metas = await GetMetasUsuarioAsync(usuarioId, balanceGeneral);

            return Ok(new
            {
                ok = true,
                balance = balanceGeneral,
                transacciones = todas,
                transaccionesFiltradas = filtradas,
                balanceFiltrado,
                desgloseCategorias = desglose,
                notificaciones,
                categorias = catalogo,
                metas
            });
        }

        /// <summary>
        /// POST /api/finanzas/movimientos
        /// Valida e inserta un nuevo movimiento en la tabla `Movimientos` guardando únicamente `CategoriaId` y `UsuarioId` (3FN)
        /// y almacenando `Timestamp` en formato legible "yyyy-MM-dd HH:mm:ss".
        /// </summary>
        [HttpPost("movimientos")]
        public async Task<IActionResult> CreateMovimiento([FromBody] CrearMovimientoRequest request)
        {
            if (request == null || request.UsuarioId <= 0)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Sesión requerida",
                    message = "Debes iniciar sesión con una cuenta válida para registrar movimientos."
                });
            }

            if (request.Monto <= 0)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Monto inválido",
                    message = "El monto debe ser una cantidad mayor a $0.00."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Categoria))
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Categoría requerida",
                    message = "Selecciona una categoría válida del catálogo."
                });
            }

            string nombreCategoria = request.Categoria.Trim();
            var categoriaDb = await _db.Categorias
                .Include(c => c.TipoMovimiento)
                .FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombreCategoria.ToLower());

            if (categoriaDb == null)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Categoría no válida",
                    message = "Selecciona una categoría válida de la lista."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Fecha))
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Fecha requerida",
                    message = "Selecciona la fecha del movimiento."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Descripcion) || request.Descripcion.Trim().Length < 2)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Descripción requerida",
                    message = "Ingresa una descripción para este movimiento (mínimo 2 caracteres)."
                });
            }

            string fechaHoraLegible = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);

            var entidad = new MovimientoEntity
            {
                UsuarioId = request.UsuarioId,
                CategoriaId = categoriaDb.Id,
                Monto = decimal.Round(request.Monto, 2),
                Fecha = request.Fecha.Trim(),
                Descripcion = request.Descripcion.Trim(),
                Timestamp = fechaHoraLegible
            };

            _db.Movimientos.Add(entidad);
            await _db.SaveChangesAsync();

            string tipoResuelto = categoriaDb.TipoMovimiento?.Nombre ?? "Ingreso";
            string signo = tipoResuelto == "Ingreso" ? "+" : "-";

            await AddNotificacionUsuarioAsync(
                request.UsuarioId,
                $"{tipoResuelto} registrado ({categoriaDb.Nombre}) por {signo}{FormatCurrency(entidad.Monto)}"
            );

            var nuevoDto = new Movimiento
            {
                Id = $"MOV-{entidad.Id}",
                Tipo = tipoResuelto,
                Monto = entidad.Monto,
                Categoria = categoriaDb.Nombre,
                Fecha = entidad.Fecha,
                Descripcion = entidad.Descripcion,
                Timestamp = entidad.Timestamp
            };

            var catalogo = await GetCatalogAsync();
            var presupuesto = await GetOrCreatePresupuestoAsync(request.UsuarioId);
            var movimientos = await GetMovimientosUsuarioAsync(request.UsuarioId);
            var balance = CalcularBalanceDTO(presupuesto.SaldoInicial, presupuesto.LimiteMensual, movimientos);
            var desglose = CalcularDesgloseCategorias(catalogo, movimientos);
            var notificaciones = await GetNotificacionesUsuarioAsync(request.UsuarioId);
            var metas = await GetMetasUsuarioAsync(request.UsuarioId, balance);

            return Created($"/api/finanzas/movimientos/{nuevoDto.Id}", new
            {
                ok = true,
                movimiento = nuevoDto,
                balance,
                transacciones = movimientos,
                desgloseCategorias = desglose,
                notificaciones,
                categorias = catalogo,
                metas
            });
        }

        /// <summary>
        /// DELETE /api/finanzas/movimientos/{id}?usuarioId={usuarioId}
        /// Elimina físicamente una transacción de la tabla `Movimientos` y recalcula el estado.
        /// </summary>
        [HttpDelete("movimientos/{id}")]
        public async Task<IActionResult> DeleteMovimiento([FromRoute] string id, [FromQuery] int usuarioId = 0)
        {
            string limpio = id.Replace("MOV-", "", StringComparison.OrdinalIgnoreCase).Trim();
            if (!int.TryParse(limpio, out int numericId))
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "ID inválido",
                    message = $"El identificador '{id}' no tiene un formato válido."
                });
            }

            var query = _db.Movimientos
                .Include(m => m.Categoria)
                .Where(m => m.Id == numericId);

            if (usuarioId > 0)
            {
                query = query.Where(m => m.UsuarioId == usuarioId);
            }

            var existente = await query.FirstOrDefaultAsync();
            if (existente == null)
            {
                return NotFound(new
                {
                    ok = false,
                    titulo = "No encontrado",
                    message = $"No se encontró el movimiento con ID {id}."
                });
            }

            int propietarioId = existente.UsuarioId;
            string nombreCategoria = existente.Categoria?.Nombre ?? "Movimiento";

            _db.Movimientos.Remove(existente);
            await _db.SaveChangesAsync();

            await AddNotificacionUsuarioAsync(
                propietarioId,
                $"Movimiento eliminado ({nombreCategoria}) por {FormatCurrency(existente.Monto)}"
            );

            var catalogo = await GetCatalogAsync();
            var presupuesto = await GetOrCreatePresupuestoAsync(propietarioId);
            var movimientos = await GetMovimientosUsuarioAsync(propietarioId);
            var balance = CalcularBalanceDTO(presupuesto.SaldoInicial, presupuesto.LimiteMensual, movimientos);
            var desglose = CalcularDesgloseCategorias(catalogo, movimientos);
            var notificaciones = await GetNotificacionesUsuarioAsync(propietarioId);
            var metas = await GetMetasUsuarioAsync(propietarioId, balance);

            return Ok(new
            {
                ok = true,
                eliminadoId = $"MOV-{numericId}",
                balance,
                transacciones = movimientos,
                desgloseCategorias = desglose,
                notificaciones,
                categorias = catalogo,
                metas
            });
        }

        // =========================================================================
        // 4. ENDPOINTS DE METAS DE AHORRO (PERSISTENCIA Y CÁLCULO 3FN)
        // =========================================================================

        /// <summary>
        /// GET /api/finanzas/metas?usuarioId={id}
        /// Lista todas las metas de ahorro del usuario almacenadas en `MetasAhorro`, calculando su cuota y viabilidad en el DTO.
        /// </summary>
        [HttpGet("metas")]
        public async Task<IActionResult> GetMetas([FromQuery] int usuarioId = 0)
        {
            var presupuesto = await GetOrCreatePresupuestoAsync(usuarioId);
            var movimientos = await GetMovimientosUsuarioAsync(usuarioId);
            var balance = CalcularBalanceDTO(presupuesto.SaldoInicial, presupuesto.LimiteMensual, movimientos);
            var metas = await GetMetasUsuarioAsync(usuarioId, balance);

            return Ok(new
            {
                ok = true,
                metas,
                balance
            });
        }

        /// <summary>
        /// POST /api/finanzas/metas/calcular
        /// Persiste una nueva meta en la tabla `MetasAhorro` (solo datos fuente 3FN) y calcula su proyección y viabilidad.
        /// </summary>
        [HttpPost("metas/calcular")]
        public async Task<IActionResult> CalcularMeta([FromBody] MetaAhorroRequest request)
        {
            if (request == null || request.MontoObjetivo <= 0)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Monto inválido",
                    message = "El monto objetivo de la meta debe ser mayor a $0.00."
                });
            }

            int plazoLimpio = Math.Max(1, request.PlazoMeses);
            string nombreLimpio = string.IsNullOrWhiteSpace(request.Nombre)
                ? "Meta de Ahorro"
                : request.Nombre.Trim();
            decimal montoLimpio = decimal.Round(request.MontoObjetivo, 2);

            var presupuesto = await GetOrCreatePresupuestoAsync(request.UsuarioId);
            var movimientos = await GetMovimientosUsuarioAsync(request.UsuarioId);
            var balance = CalcularBalanceDTO(presupuesto.SaldoInicial, presupuesto.LimiteMensual, movimientos);

            int metaIdGenerada = 0;

            if (request.UsuarioId > 0)
            {
                var nuevaEntidad = new MetaAhorroEntity
                {
                    UsuarioId = request.UsuarioId,
                    Nombre = nombreLimpio,
                    MontoObjetivo = montoLimpio,
                    PlazoMeses = plazoLimpio
                };

                _db.MetasAhorro.Add(nuevaEntidad);
                await _db.SaveChangesAsync();
                metaIdGenerada = nuevaEntidad.Id;

                await AddNotificacionUsuarioAsync(
                    request.UsuarioId,
                    $"Meta de ahorro registrada ({nombreLimpio}) por {FormatCurrency(montoLimpio)} a {plazoLimpio} meses"
                );
            }

            var proyeccion = ProyectarMetaAhorro(
                metaIdGenerada,
                nombreLimpio,
                montoLimpio,
                plazoLimpio,
                request.UsarSaldoActual,
                balance
            );

            var metas = await GetMetasUsuarioAsync(request.UsuarioId, balance);
            var notificaciones = await GetNotificacionesUsuarioAsync(request.UsuarioId);

            return Ok(new
            {
                ok = true,
                meta = proyeccion,
                metas,
                balance,
                notificaciones
            });
        }

        /// <summary>
        /// DELETE /api/finanzas/metas/{id}?usuarioId={usuarioId}
        /// Elimina físicamente una meta de ahorro de la tabla `MetasAhorro`.
        /// </summary>
        [HttpDelete("metas/{id}")]
        public async Task<IActionResult> DeleteMeta([FromRoute] string id, [FromQuery] int usuarioId = 0)
        {
            string limpio = id.Replace("META-", "", StringComparison.OrdinalIgnoreCase).Trim();
            if (!int.TryParse(limpio, out int numericId))
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "ID de meta inválido",
                    message = $"El identificador '{id}' no es válido."
                });
            }

            var query = _db.MetasAhorro.Where(m => m.Id == numericId);
            if (usuarioId > 0)
            {
                query = query.Where(m => m.UsuarioId == usuarioId);
            }

            var existente = await query.FirstOrDefaultAsync();
            if (existente == null)
            {
                return NotFound(new
                {
                    ok = false,
                    titulo = "Meta no encontrada",
                    message = $"No se encontró la meta de ahorro con ID {id}."
                });
            }

            int propietarioId = existente.UsuarioId;
            string nombreMeta = existente.Nombre;

            _db.MetasAhorro.Remove(existente);
            await _db.SaveChangesAsync();

            await AddNotificacionUsuarioAsync(
                propietarioId,
                $"Meta de ahorro eliminada ({nombreMeta})"
            );

            var presupuesto = await GetOrCreatePresupuestoAsync(propietarioId);
            var movimientos = await GetMovimientosUsuarioAsync(propietarioId);
            var balance = CalcularBalanceDTO(presupuesto.SaldoInicial, presupuesto.LimiteMensual, movimientos);
            var metas = await GetMetasUsuarioAsync(propietarioId, balance);
            var notificaciones = await GetNotificacionesUsuarioAsync(propietarioId);

            return Ok(new
            {
                ok = true,
                eliminadoId = $"META-{numericId}",
                metas,
                balance,
                notificaciones
            });
        }
    }
}
