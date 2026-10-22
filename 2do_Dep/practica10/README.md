# Práctica 10 — Sistema Web de Control de Finanzas Personales con SQLite (3FN) y Autenticación

Sistema Full Stack de Control de Finanzas Personales desarrollado bajo el patrón **MVC (Model-View-Controller)** que integra un Frontend reactivo en **React + TypeScript + Bootstrap 5** con un Backend RESTful en **ASP.NET Core Web API (.NET 8)** y persistencia relacional en **SQLite (`finanzas.db`)** normalizada estrictamente hasta la **Tercera Forma Normal (3FN)**.

---

## 1. Arquitectura de Base de Datos SQLite Normalizada hasta 3FN

El contexto relacional [`FinanzasDbContext.cs`](./server/Data/FinanzasDbContext.cs) y las entidades definidas en [`Entidades3FN.cs`](./server/Models/Entidades3FN.cs) materializan **7 tablas relacionales** al ejecutar `db.Database.EnsureCreated()` en [`Program.cs`](./server/Program.cs):

### Diagrama Entidad-Relación (3FN)

```mermaid
erDiagram
    TiposMovimiento ||--o{ Categorias : "TipoMovimientoId (FK)"
    Usuarios ||--|| ConfiguracionesPresupuesto : "UsuarioId (FK UNIQUE 1:1)"
    Usuarios ||--o{ Movimientos : "UsuarioId (FK)"
    Categorias ||--o{ Movimientos : "CategoriaId (FK)"
    Usuarios ||--o{ MetasAhorro : "UsuarioId (FK)"
    Usuarios ||--o{ Notificaciones : "UsuarioId (FK)"

    TiposMovimiento {
        int Id PK
        string Nombre UK "Ingreso | Egreso"
    }

    Categorias {
        int Id PK
        string Nombre UK "16 Categorias Oficiales"
        int TipoMovimientoId FK
    }

    Usuarios {
        int Id PK
        string Nombre
        string Email UK
        string Password
        string AvatarDataUrl
        DateTime FechaRegistro
    }

    ConfiguracionesPresupuesto {
        int Id PK
        int UsuarioId FK_UK
        decimal SaldoInicial
        decimal LimiteMensual
    }

    Movimientos {
        int Id PK
        int UsuarioId FK
        int CategoriaId FK
        decimal Monto
        string Fecha
        string Descripcion
        string Timestamp "yyyy-MM-dd HH:mm:ss"
    }

    MetasAhorro {
        int Id PK
        int UsuarioId FK
        string Nombre
        decimal MontoObjetivo
        int PlazoMeses
    }

    Notificaciones {
        int Id PK
        int UsuarioId FK
        string Texto
        string Hora
        bool Leida
    }
```

### Cumplimiento de las Formas Normales (1FN, 2FN y 3FN)

1. **Primera Forma Normal (1FN — Atomicidad):**
   - Todos los atributos de las 7 tablas almacenan valores escalares e indivisibles. No existen listas separadas por comas, arreglos serializados ni grupos repetitivos en ninguna columna.
2. **Segunda Forma Normal (2FN — Dependencia Funcional Completa):**
   - Cada tabla cuenta con una clave primaria simple (`Id`), y todos los atributos no clave dependen funcionalmente en su totalidad de la clave primaria de su tabla.
3. **Tercera Forma Normal (3FN — Sin Dependencias Transitivas ni Columnas Calculadas):**
   - **Separación de Catálogos (`TiposMovimiento` y `Categorias`):** La tabla `Movimientos` **no guarda** el nombre de la categoría ni el tipo (`Ingreso`/`Egreso`) como texto redundante; almacena únicamente `CategoriaId` (`FK`) y resuelve la información mediante `.Include(m => m.Categoria).ThenInclude(c => c.TipoMovimiento)`.
   - **Aislamiento de Parámetros Presupuestales (`ConfiguracionesPresupuesto`):** El `SaldoInicial` y el `LimiteMensual` se almacenan en su propia entidad vinculada 1:1 con `Usuarios` mediante `UsuarioId` (`UNIQUE`).
   - **Cálculo Dinámico de Saldos y Metas (`MetasAhorro`):** Ni el saldo actual disponible ni la cuota mensual requerida ni la viabilidad de las metas se almacenan como columnas calculadas en SQLite; se proyectan dinámicamente en tiempo de ejecución en [`FinanzasController.cs`](./server/Controllers/FinanzasController.cs).

### Data Seeding Inicial Automático

Al arrancar el servidor (`db.Database.EnsureCreated()`), EF Core precarga automáticamente:
- **2 `TiposMovimiento`**: `1 = Ingreso`, `2 = Egreso`.
- **16 `Categorias` oficiales**:
  - **8 de Ingreso:** *Sueldo, Inversión, Ventas / Negocio, Honorarios / Freelance, Bonos y Aguinaldo, Beca / Apoyo, Reembolsos, Otros (Ingresos)*.
  - **8 de Egreso:** *Alimentos, Transporte, Servicios, Vivienda / Renta, Salud y Farmacia, Educación, Ocio, Otros (Gastos)*.

---

## 2. Flujo de Pantallas (Autenticación + 5 Vistas Financieras por `UsuarioId`)

1. **Login (`LoginView.tsx`):**
   - Campos vacíos por defecto (sin autocompletado demo), casilla *"Recordar mis datos"*, enlace a *"Crear cuenta"* y Modal Emergente de aviso con botón *"Aceptar"* si la cuenta no existe o la contraseña falla en SQLite.
2. **Registro de Cuenta (`RegistroView.tsx`):**
   - Captura de Nombre Completo, Correo Electrónico, Saldo Inicial (`$0.00` o mayor), Límite Mensual, Contraseña, Confirmación, **carga local de Imagen de Perfil con vista previa circular** y botón *"Aceptar imagen"*, además de casilla y **Modal Emergente de Aviso de Privacidad**.
3. **Navbar Institucional (`Navbar.jsx`):**
   - Logo izquierdo fijo (`$ Finanzas`, sin botón de edición).
   - Sin sesión activa: oculta pestañas, saldo, perfil, notificaciones y botón de salida.
   - Con sesión activa: muestra las 5 pestañas con efecto burbuja (`#00D9FF`), saldo disponible en vivo, avatar circular con foto de perfil (o inicial) y nombre del usuario (solo lectura), campana de notificaciones desde la tabla `Notificaciones` y botón *"Cerrar Sesión"*.
4. **5 Pantallas Financieras Filtradas por `UsuarioId`:**
   - **Dashboard / Calculadora de Presupuesto (`DashboardView.jsx`)**: Edición de `SaldoInicial` y `LimiteMensual` en `ConfiguracionesPresupuesto`, indicadores y barra de sincronización limpia.
   - **Registro de Movimientos (`MovimientosView.jsx`)**: Conectado al catálogo de 16 categorías de SQLite, inserta en `Movimientos` y `Notificaciones` y despliega Modal Emergente de confirmación.
   - **Historial y Reportes (`ReportesView.jsx`)**: Filtros por tipo, categoría, búsqueda de texto y eliminación física en SQLite (`DELETE /api/finanzas/movimientos/{id}`).
   - **Simulador de Metas de Ahorro (`MetasView.jsx`)**: Creación, listado y eliminación física en la tabla `MetasAhorro` de SQLite.
   - **Análisis de Presupuesto (`AnaliticaView.jsx`)**: Comparativa porcentual y desglose completo de las 16 categorías.

---

## 3. Instrucciones de Ejecución

### Paso 1: Iniciar el Backend ASP.NET Core (.NET 8 + SQLite 3FN)

En una terminal:

```bash
cd 2do_Dep/practica10/server
dotnet run
```

- El servidor escuchará en `http://localhost:5000` y creará automáticamente el archivo `finanzas.db` con las 7 tablas normalizadas en 3FN y las 16 categorías precargadas.

### Paso 2: Iniciar el Frontend React + TypeScript (Vite)

En una segunda terminal:

```bash
cd 2do_Dep/practica10/client
npm install
npm run dev
```

- Abre en tu navegador la URL indicada por Vite (por defecto `http://localhost:5173`).
- **Para abrir en tu celular (Móvil):**
  - **Por Red Local (Wi-Fi) o Anclaje de Red por Cable USB (*USB Tethering*):** Abre en el navegador de tu celular la dirección `Network: http://192.168.X.X:5173/` que aparece en la terminal de Vite.
  - **Por Cable USB con `adb reverse` (Android):** Ejecuta `adb reverse tcp:5173 tcp:5173` y `adb reverse tcp:5000 tcp:5000` y entra a `http://localhost:5173` en el navegador del celular.
