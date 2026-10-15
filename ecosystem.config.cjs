// Configuración de PM2 para mantener INVENTIA activo en segundo plano.
// Uso: npm run build && pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'inventia',
      script: 'dist/server.cjs',
      env: { PORT: 3000, HOST: '0.0.0.0' },
      max_memory_restart: '400M',
      autorestart: true,
    },
  ],
};
