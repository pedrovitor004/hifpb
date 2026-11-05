@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale Node.js 22 LTS e abra este arquivo novamente.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo HIFPB: http://127.0.0.1:5173
echo Coordenador: root
echo Senha: 0123456789
call npm run dev
pause
