/**
 * Carga las variables de entorno ANTES que cualquier otro módulo del servidor.
 * Prioridad: variables del sistema > .env.local > .env
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env', quiet: true });
