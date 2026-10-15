import './server/env.js'; // debe ir primero: carga .env.local / .env
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { pgDb } from './server/db.js';
import { analyticsEngine } from './server/analyticsEngine.js';
import { chatWithInventia, executeTool } from './server/inventiaAgent.js';
import { guardarEstado, leerEstado, rutaEstado } from './server/persistence.js';

// En el paquete compilado (dist/server.cjs) esbuild fija NODE_ENV="production".
const IS_PROD = process.env.NODE_ENV === 'production';

function geminiConfigurado(): boolean {
  const k = process.env.GEMINI_API_KEY?.trim();
  return Boolean(k && k !== 'MY_GEMINI_API_KEY' && !k.startsWith('PLACEHOLDER'));
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  // Restaura la configuración del motor guardada en disco (si existe)
  const estadoGuardado = leerEstado();
  if (estadoGuardado?.config) analyticsEngine.setConfig(estadoGuardado.config);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      modo: IS_PROD ? 'produccion' : 'desarrollo',
      gemini: geminiConfigurado(),
    });
  });

  // Chat with INVENTIA agent
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Mensaje requerido.' });
        return;
      }
      const response = await chatWithInventia(message);
      res.json(response);
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      res.status(500).json({ error: err?.message || 'Error procesando solicitud con INVENTIA' });
    }
  });

  // Database endpoints (PostgreSQL simulation for Abarrotes)
  app.get('/api/database/products', (req, res) => {
    const products = pgDb.selectProductos();
    const inventory = pgDb.selectInventario();
    const invMap = new Map(inventory.map(i => [i.producto_id, i]));
    const suppliers = pgDb.selectProveedores();
    const supMap = new Map(suppliers.map(s => [s.id, s]));

    const merged = products.map(p => {
      const inv = invMap.get(p.id);
      const sup = supMap.get(p.proveedor_id);
      return {
        ...p,
        stock_actual: inv?.stock_actual || 0,
        ubicacion: inv?.ubicacion || 'General',
        ultimo_reabastecimiento: inv?.ultimo_reabastecimiento || 'N/D',
        proveedor_nombre: sup?.nombre || 'Desconocido',
        plazo_entrega_dias: sup?.plazo_entrega_dias || 2
      };
    });

    res.json(merged);
  });

  app.get('/api/database/suppliers', (req, res) => {
    res.json(pgDb.selectProveedores());
  });

  // Modify stock to test real-time reactivity of INVENTIA
  app.post('/api/database/update-stock', (req, res) => {
    const { producto_id, deltaStock, setStock } = req.body;
    if (!producto_id) {
      res.status(400).json({ error: 'producto_id requerido' });
      return;
    }

    if (typeof setStock === 'number') {
      const result = pgDb.setStock(producto_id, setStock);
      res.json(result);
      return;
    }

    if (typeof deltaStock === 'number') {
      const result = pgDb.updateStock(producto_id, deltaStock);
      res.json(result);
      return;
    }

    res.status(400).json({ error: 'Debe especificar deltaStock o setStock' });
  });

  // Analytics: ABC-XYZ
  app.get('/api/analytics/abc-xyz', (req, res) => {
    const result = analyticsEngine.calcular_abc_xyz();
    res.json(result);
  });

  // Analytics: Policies
  app.get('/api/analytics/policies', (req, res) => {
    const result = analyticsEngine.calcular_todas_politicas();
    res.json(result);
  });

  // Analytics: Risks
  app.get('/api/analytics/risks', (req, res) => {
    const result = analyticsEngine.analizar_riesgo();
    res.json(result);
  });

  // Analytics: Recommendations
  app.get('/api/analytics/recommendations', (req, res) => {
    const result = analyticsEngine.recomendar_compra();
    res.json(result);
  });

  // Analytics: Dashboard KPIs
  app.get('/api/analytics/dashboard', (req, res) => {
    const result = analyticsEngine.consultar_dashboard();
    res.json(result);
  });

  // Analytics: 7-day KPI history (Nivel de Servicio vs. Valor de Inventario)
  app.get('/api/analytics/kpi-history', (req, res) => {
    const days = Number(req.query.days) || 7;
    const result = analyticsEngine.obtener_historial_kpis(days);
    res.json(result);
  });

  // Analytics: Weekly demand forecast and major purchases anticipation
  app.get('/api/analytics/demand-forecast', (req, res) => {
    const factor = Number(req.query.factor) || 1.0;
    const result = analyticsEngine.predecir_demanda_semanal_compras(factor);
    res.json(result);
  });

  // Update policies config (Service level, holding rate, etc.)
  app.post('/api/analytics/config', (req, res) => {
    const { nivel_servicio_pct, tasa_mantenimiento_anual, corte_abc_a, corte_abc_b } = req.body;
    analyticsEngine.setConfig({
      ...(nivel_servicio_pct ? { nivel_servicio_pct: Number(nivel_servicio_pct) } : {}),
      ...(tasa_mantenimiento_anual ? { tasa_mantenimiento_anual: Number(tasa_mantenimiento_anual) } : {}),
      ...(corte_abc_a ? { corte_abc_a: Number(corte_abc_a) } : {}),
      ...(corte_abc_b ? { corte_abc_b: Number(corte_abc_b) } : {})
    });
    const config = analyticsEngine.getConfig();
    guardarEstado({ config: config as unknown as Record<string, number> });
    res.json(config);
  });

  app.get('/api/analytics/config', (req, res) => {
    res.json(analyticsEngine.getConfig());
  });

  // Restablece los datos iniciales de demostración (stock y configuración)
  app.post('/api/database/reset', (req, res) => {
    pgDb.resetToInitial();
    analyticsEngine.resetConfig();
    res.json({ success: true, mensaje: 'Datos restablecidos a los valores iniciales.' });
  });

  // Tool execution workbench (direct invocation of any of the 10 tools)
  app.post('/api/tools/execute', (req, res) => {
    const { tool_name, parameters } = req.body;
    if (!tool_name) {
      res.status(400).json({ error: 'tool_name requerido' });
      return;
    }
    const execution = executeTool(tool_name, parameters || {});
    res.json(execution);
  });

  // Rutas /api inexistentes → 404 en JSON (no devolver el HTML de la app)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
  });

  if (!IS_PROD) {
    // Desarrollo: Vite como middleware (recarga en caliente). Import dinámico para
    // que el servidor de producción no dependa de Vite.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      console.error('[INVENTIA] No se encontró dist/index.html. Ejecuta primero: npm run build');
      process.exit(1);
    }
    app.use(express.static(distPath, { index: false, maxAge: '1h' }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log('\n  INVENTIA - Optimización de Inventarios');
    console.log(`  ➜ Modo:    ${IS_PROD ? 'producción' : 'desarrollo'}`);
    console.log(`  ➜ Local:   http://localhost:${PORT}`);
    console.log(`  ➜ Red:     http://<IP-de-este-equipo>:${PORT}`);
    console.log(`  ➜ IA:      ${geminiConfigurado() ? 'Gemini' : 'motor analítico local (sin GEMINI_API_KEY)'}`);
    console.log(`  ➜ Datos:   ${rutaEstado()}\n`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[INVENTIA] El puerto ${PORT} ya está en uso. Cierra la otra aplicación o define otro PORT en .env.local`);
    } else {
      console.error('[INVENTIA] Error del servidor:', err);
    }
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error('[INVENTIA] No se pudo iniciar el servidor:', err);
  process.exit(1);
});
