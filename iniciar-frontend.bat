@echo off
title Frontend - Sistema de Gestao
cd /d "C:\Users\fsbor\OneDrive\Borges\Backup 📁\Documentos\Default Project\frontend"
set PATH=C:\Program Files\nodejs;%PATH%
echo Iniciando Frontend...
"C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js --port 5173 --host 127.0.0.1
pause
