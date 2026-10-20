# Sistema de Control de Finanzas Personales — Arquitectura MVC

Micrositio y Calculadora Financiera desarrollada bajo el patrón **Modelo-Vista-Controlador (MVC)** combinando:
- **Frontend (View):** React + TypeScript
- **Maquetación y UI (Layout):** Bootstrap 5 + Hoja de estilos institucional (`styles.css`)
- **Backend API (Model & Controller):** ASP.NET Core Web API (.NET 8 en C#)

---

## Estructura del Proyecto

```text
practica9/
├── README.md
├── server/                                # Backend MVC en ASP.NET Core (.NET / C#)
│   ├── FinanzasApi.csproj
│   ├── Program.cs
│   ├── Properties/
│   │   └── launchSettings.json            # Configurado en http://localhost:5000
│   ├── Models/
│   │   ├── Movimiento.cs                  # Modelo de transacciones y catálogo de 16 categorías
│   │   ├── Balance.cs                     # Modelo de saldo actual, ingresos, egresos y porcentajes
│   │   └── MetaAhorro.cs                  # Modelo de proyecciones de metas de ahorro
│   ├── Services/
│   │   └── MemoryStore.cs                 # Almacén estático en memoria (List<Movimiento>)
│   └── Controllers/
│       └── FinanzasController.cs          # Controlador REST (/api/finanzas/*)
└── client/                                # Frontend View en React + TypeScript + Bootstrap 5
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles.css
        ├── services/
        │   └── finanzasApi.ts             # Servicio HTTP tipado en TypeScript (fetch a .NET)
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Notificaciones.jsx
        │   └── FrameworkBadge.jsx
        └── views/
            ├── DashboardView.jsx          # 1. Dashboard / Calculadora Financiera
            ├── MovimientosView.jsx        # 2. Registro de Movimientos (8 Ingresos / 8 Egresos)
            ├── ReportesView.jsx           # 3. Historial y Reportes con filtros
            ├── MetasView.jsx              # 4. Simulador de Metas de Ahorro
            └── AnaliticaView.jsx          # 5. Análisis de Presupuesto y Categorías
```

---

## Endpoints REST en ASP.NET Core (`FinanzasController.cs`)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/finanzas/balance` | Obtiene el saldo actual, totales, porcentajes y desglose por categorías. |
| `PUT` | `/api/finanzas/balance` | Ajusta el saldo inicial base de la calculadora financiera. |
| `GET` | `/api/finanzas/movimientos` | Lista todas las transacciones registradas en `MemoryStore`. |
| `POST` | `/api/finanzas/movimientos` | Registra un nuevo movimiento (`Ingreso` o `Egreso`). |
| `DELETE` | `/api/finanzas/movimientos/{id}` | Elimina una transacción por su ID y recalcula el balance. |
| `POST` | `/api/finanzas/metas/calcular` | Calcula la cuota mensual de ahorro y valida cobertura con el flujo actual. |

---

## Instrucciones de Ejecución

### 1. Iniciar el Backend (.NET / ASP.NET Core)
En una primera terminal, dentro de `2do_Dep/practica9`:

```bash
cd server && dotnet run
```
El servidor API REST quedará escuchando en `http://localhost:5000`.

### 2. Iniciar el Frontend (React + TypeScript + Vite)
En una segunda terminal, dentro de `2do_Dep/practica9`:

```bash
cd client && npm install && npm run dev
```
El cliente React se abrirá en `http://localhost:5173` conectado automáticamente al backend de ASP.NET Core.

---

*Frontend: React + TypeScript | Layout: Bootstrap 5 | Backend: ASP.NET Core (.NET)*

