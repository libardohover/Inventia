@echo off
REM Inicia INVENTIA en Windows (servidor local de produccion)
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias...
  call npm install || goto :error
)
if not exist .env.local (
  copy .env.example .env.local >nul
  echo Se creo .env.local. Agrega tu GEMINI_API_KEY si deseas usar Gemini.
)
call npm run build || goto :error
call npm start
goto :eof
:error
echo Ocurrio un error. Revisa los mensajes anteriores.
pause
