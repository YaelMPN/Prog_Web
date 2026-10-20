/**
 * ============================================================================
 * SISTEMA DE CONTROL DE FINANZAS PERSONALES
 * Archivo: server/Controllers/FinanzasController.cs
 * Framework Backend: ASP.NET Core Web API (.NET) - Capa CONTROLLER (MVC)
 * Rol Arquitectónico: Controlador RESTful ([ApiController]) que recibe las
 * peticiones HTTP del cliente React + TypeScript, invoca la capa de Modelos y
 * MemoryStore, y retorna respuestas JSON estructuradas.
 * ============================================================================
 */

using Microsoft.AspNetCore.Mvc;
using FinanzasApi.Models;
using FinanzasApi.Services;

namespace FinanzasApi.Controllers
{
    [ApiController]
    [Route("api/finanzas")]
    public class FinanzasController : ControllerBase
    {
        /// <summary>
        /// Construye el estado sincronizado completo para el frontend React.
        /// </summary>
        private static object BuildStatePayload(object? extra = null)
        {
            return new
            {
                ok = true,
                balance = MemoryStore.GetBalance(),
                transacciones = MemoryStore.GetMovimientos(),
                desgloseCategorias = MemoryStore.GetDesgloseCategorias(),
                notificaciones = MemoryStore.GetNotificaciones(),
                categorias = MemoryStore.GetCatalog(),
                detalle = extra
            };
        }

        /// <summary>
        /// GET /api/finanzas/balance
        /// Devuelve el balance actual, totales de ingresos/egresos, desglose de categorías y notificaciones.
        /// </summary>
        [HttpGet("balance")]
        public IActionResult GetBalance()
        {
            return Ok(BuildStatePayload());
        }

        /// <summary>
        /// PUT /api/finanzas/balance
        /// Actualiza el Saldo Inicial Base desde la calculadora del Dashboard.
        /// </summary>
        [HttpPut("balance")]
        public IActionResult UpdateSaldoBase([FromBody] ActualizarSaldoBaseRequest request)
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

            MemoryStore.SetSaldoBase(request.SaldoBase);
            return Ok(BuildStatePayload());
        }

        /// <summary>
        /// GET /api/finanzas/movimientos
        /// Obtiene el listado de transacciones registradas (con filtros opcionales por tipo, categoría y búsqueda).
        /// </summary>
        [HttpGet("movimientos")]
        public IActionResult GetMovimientos(
            [FromQuery] string? tipo = "TODOS",
            [FromQuery] string? categoria = "TODAS",
            [FromQuery] string? busqueda = "")
        {
            var filtradas = MemoryStore.GetMovimientos(tipo, categoria, busqueda);
            var balanceFiltrado = MemoryStore.GetBalance(filtradas);

            return Ok(new
            {
                ok = true,
                balance = MemoryStore.GetBalance(),
                transacciones = MemoryStore.GetMovimientos(),
                transaccionesFiltradas = filtradas,
                balanceFiltrado,
                desgloseCategorias = MemoryStore.GetDesgloseCategorias(),
                notificaciones = MemoryStore.GetNotificaciones(),
                categorias = MemoryStore.GetCatalog()
            });
        }

        /// <summary>
        /// POST /api/finanzas/movimientos
        /// Valida y registra una nueva transacción (Ingreso o Egreso) en MemoryStore.
        /// </summary>
        [HttpPost("movimientos")]
        public IActionResult CreateMovimiento([FromBody] CrearMovimientoRequest request)
        {
            if (request == null || request.Monto <= 0)
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Monto inválido",
                    message = "El monto debe ser una cantidad mayor a $0.00."
                });
            }

            if (!MemoryStore.EsCategoriaValida(request.Categoria))
            {
                return BadRequest(new
                {
                    ok = false,
                    titulo = "Categoría requerida",
                    message = "Selecciona una categoría válida del catálogo."
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
                    message = "Ingresa una descripción para este movimiento."
                });
            }

            var nuevo = MemoryStore.AddMovimiento(request);

            return Created($"/api/finanzas/movimientos/{nuevo.Id}", new
            {
                ok = true,
                movimiento = nuevo,
                balance = MemoryStore.GetBalance(),
                transacciones = MemoryStore.GetMovimientos(),
                desgloseCategorias = MemoryStore.GetDesgloseCategorias(),
                notificaciones = MemoryStore.GetNotificaciones(),
                categorias = MemoryStore.GetCatalog()
            });
        }

        /// <summary>
        /// DELETE /api/finanzas/movimientos/{id}
        /// Elimina una transacción por su identificador y devuelve el balance recalculado.
        /// </summary>
        [HttpDelete("movimientos/{id}")]
        public IActionResult DeleteMovimiento([FromRoute] string id)
        {
            bool eliminado = MemoryStore.DeleteMovimiento(id);
            if (!eliminado)
            {
                return NotFound(new
                {
                    ok = false,
                    titulo = "No encontrado",
                    message = $"No se encontró el movimiento con ID {id}."
                });
            }

            return Ok(new
            {
                ok = true,
                eliminadoId = id,
                balance = MemoryStore.GetBalance(),
                transacciones = MemoryStore.GetMovimientos(),
                desgloseCategorias = MemoryStore.GetDesgloseCategorias(),
                notificaciones = MemoryStore.GetNotificaciones(),
                categorias = MemoryStore.GetCatalog()
            });
        }

        /// <summary>
        /// POST /api/finanzas/metas/calcular
        /// Calcula la cuota mensual requerida para una meta fija de ahorro y valida su viabilidad contra el saldo/flujo actual.
        /// </summary>
        [HttpPost("metas/calcular")]
        public IActionResult CalcularMeta([FromBody] MetaAhorroRequest request)
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

            var proyeccion = MemoryStore.CalcularMetaAhorro(request);

            return Ok(new
            {
                ok = true,
                meta = proyeccion,
                balance = MemoryStore.GetBalance()
            });
        }
    }
}

