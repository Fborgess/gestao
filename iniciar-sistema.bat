@echo off
echo Iniciando Sistema de Gestao...
echo.

echo [1/2] Iniciando Backend...
start "Backend" cmd /c "cd /d "C:\Users\fsbor\OneDrive\Borges\Backup 📁\Documentos\Default Project\backend" && python -m uvicorn app.main:app --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Frontend...
start "Frontend" cmd /c "cd /d "C:\Users\fsbor\OneDrive\Borges\Backup 📁\Documentos\Default Project\frontend" && set PATH=C:\Program Files\nodejs;%PATH% && "C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js --port 5173 --host"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  Sistema de Gestao Iniciado!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000/docs
echo ========================================
echo.
echo Pressione ANY para fechar esta janela...
pause >nul
