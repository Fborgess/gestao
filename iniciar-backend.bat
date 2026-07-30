@echo off
title Backend - Sistema de Gestao
cd /d "C:\Users\fsbor\OneDrive\Borges\Backup \U0001f4c1\Documentos\Default Project\backend"

echo ========================================
echo  Backend - Sistema de Gestao
echo  http://localhost:8000/docs
echo ========================================
echo.
echo Iniciando backend...
python -m uvicorn app.main:app --port 8000
pause
