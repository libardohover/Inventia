# INVENTIA · Optimización de Inventarios

Agente inteligente y motor analítico de inventarios para **tiendas de abarrotes**. Decide **QUÉ, CUÁNTO y CUÁNDO comprar, y POR QUÉ**, con modelos de clasificación ABC-XYZ, punto de reorden (ROP), lote económico (EOQ) y stock de seguridad. Moneda: pesos colombianos (COP).

## Módulos

| Módulo | Descripción |
|---|---|
| **Dashboard KPIs** | Valor del inventario, nivel de servicio, alertas y evolución de los últimos 7 días |
| **Agente INVENTIA** | Chat con Gemini (llamado de herramientas) y motor analítico local de respaldo, con trazabilidad DATO → CÁLCULO → RECOMENDACIÓN |
| **Matriz ABC-XYZ** | Valor económico (Pareto) frente a variabilidad de la demanda, con parámetros por producto |
| **Recomendaciones** | Órdenes de compra priorizadas: cantidad sugerida, proveedor, inversión y momento |
| **Monitor de Riesgos** | Riesgo de agotamiento y sobreinventario |
| **Base de datos y herramientas** | Tabla de productos e inventario editable y ejecución directa de las 10 herramientas del agente |
| **Pronóstico semanal** | Proyección de demanda y compras mayores anticipadas |

## Tecnologías

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Recharts · Express 4 · Google Gemini (`@google/genai`)

## Requisitos

- [Node.js](https://nodejs.org/) **20.19 o superior** (recomendado 22 LTS)
- Opcional: una clave de API de Gemini ([Google AI Studio](https://aistudio.google.com/apikey))

Sin clave de Gemini todo funciona: el agente responde con el motor analítico local usando los mismos cálculos.

## Instalación

```bash
git clone https://github.com/<usuario>/<repositorio>.git
cd <repositorio>
npm install
cp .env.example .env.local     # en Windows: copy .env.example .env.local
```

Edita `.env.local`:

```env
GEMINI_API_KEY=tu_clave_aqui
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
```

> La clave **solo se usa en el servidor**; nunca se envía al navegador. `.env.local` está excluido de Git.

## Uso

### Desarrollo (con recarga en caliente)

```bash
npm run dev
```

Abre <http://localhost:3000>.

### Despliegue en servidor local (producción)

```bash
npm run build   # compila el frontend (dist/) y el servidor (dist/server.cjs)
npm start       # inicia el servidor de producción en el puerto 3000
```

O en un solo paso: `npm run serve`.

Scripts incluidos que instalan, crean `.env.local` si falta, compilan e inician:

- **Windows:** doble clic en `iniciar-servidor.bat`
- **Linux / macOS:** `./iniciar-servidor.sh`

El servidor escucha en `0.0.0.0`: otros equipos de la red pueden entrar con `http://<IP-del-equipo>:3000`. Si no carga desde otro equipo, permite el puerto 3000 en el firewall.

#### Mantenerlo activo con PM2 (opcional)

```bash
npm install -g pm2
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

#### Con Docker (opcional)

```bash
docker build -t inventia .
docker run -d -p 3000:3000 --env-file .env.local -v inventia-data:/app/data --name inventia inventia
```

## Datos

La aplicación incluye un **conjunto de datos de demostración**: 20 productos, 6 proveedores y 90 días de ventas históricas (hasta el 7 de septiembre de 2026). Se cargan en memoria al iniciar.

Los cambios que hagas (stock de productos y configuración de políticas) **se guardan en disco** en `data/inventia-state.json` y se conservan al reiniciar el servidor.

- Para volver a los datos iniciales: borra `data/inventia-state.json` o llama a `POST /api/database/reset`.
- Para no guardar cambios: `PERSISTENCIA=false` en `.env.local`.
- La carpeta `data/` está excluida de Git.

> La interfaz se refiere a la base de datos como "PostgreSQL", pero es una simulación en memoria con la misma estructura de tablas (`productos`, `proveedores`, `inventario`, `ventas`). Conectar un PostgreSQL real requiere reemplazar `server/db.ts`.

## API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado, modo (desarrollo/producción) y si Gemini está configurado |
| `POST` | `/api/chat` | Pregunta al agente: `{ "message": "..." }` |
| `GET` | `/api/database/products` | Productos con stock y proveedor |
| `GET` | `/api/database/suppliers` | Proveedores |
| `POST` | `/api/database/update-stock` | `{ producto_id, deltaStock }` o `{ producto_id, setStock }` |
| `POST` | `/api/database/reset` | Restablece datos y configuración iniciales |
| `GET` | `/api/analytics/abc-xyz` · `policies` · `risks` · `recommendations` · `dashboard` | Resultados del motor analítico |
| `GET` | `/api/analytics/kpi-history?days=7` | Historial de KPIs |
| `GET` | `/api/analytics/demand-forecast?factor=1.0` | Pronóstico semanal |
| `GET`/`POST` | `/api/analytics/config` | Leer / cambiar nivel de servicio, tasa de mantenimiento y cortes ABC |
| `POST` | `/api/tools/execute` | `{ tool_name, parameters }` para ejecutar una herramienta del agente |

Herramientas del agente: `consultar_producto`, `consultar_inventario`, `consultar_demanda`, `calcular_abc_xyz`, `pronosticar_demanda`, `calcular_politica_inventario`, `analizar_riesgo`, `recomendar_compra`, `consultar_proveedor`, `consultar_dashboard`.

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Express + Vite) |
| `npm run build` | Compila frontend y servidor en `dist/` |
| `npm start` | Servidor de producción |
| `npm run serve` | `build` + `start` |
| `npm run typecheck` | Verificación de tipos TypeScript |
| `npm run clean` | Borra `dist/` |

## Estructura

```
├── server.ts                 # Servidor Express (API + frontend)
├── server/
│   ├── env.ts                # Carga .env.local / .env
│   ├── db.ts                 # Base de datos en memoria + datos de demostración
│   ├── persistence.ts        # Guardado de cambios en data/
│   ├── analyticsEngine.ts    # ABC-XYZ, ROP, EOQ, riesgos, pronósticos
│   └── inventiaAgent.ts      # Agente Gemini con herramientas + respaldo local
├── src/
│   ├── main.tsx · App.tsx · index.css
│   ├── components/           # Vistas
│   └── types/inventory.ts
├── scripts/build-server.mjs  # Compilación del servidor con esbuild
├── extras/github-ci.yml      # Flujo de CI opcional (ver abajo)
├── Dockerfile · ecosystem.config.cjs
└── .env.example
```

## Integración continua (opcional)

`extras/github-ci.yml` compila y verifica el proyecto en cada `push`. Para activarlo, cópialo a `.github/workflows/ci.yml`. Para subirlo necesitas un token de GitHub con el permiso **workflow**, o crearlo directamente desde la pestaña **Actions** del repositorio.

## Aviso

Las recomendaciones de INVENTIA son apoyo a la decisión y deben validarse con el conocimiento del negocio. Los datos incluidos son de demostración.
