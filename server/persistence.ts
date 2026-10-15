/**
 * Persistencia local en disco (archivo JSON) para INVENTIA.
 *
 * La base de datos de la app vive en memoria (server/db.ts). Este módulo guarda en
 * disco solo lo que el usuario cambia —stock por producto y configuración del motor—
 * para que esos cambios sobrevivan a reinicios del servidor.
 *
 * Ubicación: carpeta DATA_DIR (por defecto ./data) → inventia-state.json
 * Para volver a los datos iniciales: borrar ese archivo o usar POST /api/database/reset.
 */
import fs from 'node:fs';
import path from 'node:path';

export interface StockGuardado {
  stock_actual: number;
  ultimo_reabastecimiento: string;
}

export interface EstadoPersistido {
  version: 1;
  actualizado: string;
  inventario: Record<string, StockGuardado>;
  config?: Record<string, number>;
}

const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const STATE_FILE = path.join(DATA_DIR, 'inventia-state.json');
const PERSISTENCIA_ACTIVA = process.env.PERSISTENCIA !== 'false';

export function rutaEstado(): string {
  return STATE_FILE;
}

export function leerEstado(): EstadoPersistido | null {
  if (!PERSISTENCIA_ACTIVA) return null;
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (data && data.version === 1 && typeof data.inventario === 'object') return data;
    console.warn(`[INVENTIA] ${STATE_FILE} tiene un formato no reconocido; se ignora.`);
  } catch (err) {
    console.warn(`[INVENTIA] No se pudo leer ${STATE_FILE}; se usan datos iniciales.`, err);
  }
  return null;
}

/** Escritura atómica: se escribe en un temporal y luego se renombra. */
export function guardarEstado(parcial: { inventario?: EstadoPersistido['inventario']; config?: EstadoPersistido['config'] }): void {
  if (!PERSISTENCIA_ACTIVA) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const previo = leerEstado();
    const estado: EstadoPersistido = {
      version: 1,
      actualizado: new Date().toISOString(),
      inventario: parcial.inventario ?? previo?.inventario ?? {},
      config: parcial.config ?? previo?.config,
    };
    const tmp = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(estado, null, 2), 'utf8');
    fs.renameSync(tmp, STATE_FILE);
  } catch (err) {
    console.error(`[INVENTIA] No se pudo guardar el estado en ${STATE_FILE}:`, err);
  }
}

export function borrarEstado(): void {
  try {
    if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
  } catch (err) {
    console.error(`[INVENTIA] No se pudo borrar ${STATE_FILE}:`, err);
  }
}
