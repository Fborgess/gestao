@echo off
title Sistema Gestao
cd /d "%~dp0"
echo ==============================
echo   Sistema de Gestao - Iniciar
echo ==============================
echo.
echo Este script inicia o backend e frontend.
echo Feche esta janela para parar os servicos.
echo.
echo IP deste computador:
powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -eq 'Wi-Fi' }).IPAddress"
echo.
echo Acesse pelo celular: https://gestao-iscb.onrender.com
echo.
echo Iniciando servicos...
echo.

start "Backend" /MIN "C:\Python314\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
timeout /t 4 /nobreak >nul

cd frontend
start "Frontend" /MIN "C:\Program Files\nodejs\npx.cmd" vite --port 5173 --host
cd ..

echo.
echo Servicos iniciados! Pressione qualquer tecla para ver o status,
echo ou feche esta janela para parar tudo.
pause >nul

echo.
echo === STATUS ===
powershell -ExecutionPolicy Bypass -File "status.ps1"
echo.
pause
