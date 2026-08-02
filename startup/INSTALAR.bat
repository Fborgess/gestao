@echo off
rem Restaura a configuracao de auto-inicio do Sistema Gestao a partir deste repo.
rem Copia o script e o bat para os lugares da maquina.
echo Restaurando auto-inicio do Sistema Gestao...
if not exist "C:\Users\fsbor\gestao-backups\startup-scripts" mkdir "C:\Users\fsbor\gestao-backups\startup-scripts"
copy /Y "%~dp0SistemaGestao.py" "C:\Users\fsbor\gestao-backups\startup-scripts\SistemaGestao.py"
copy /Y "%~dp0SistemaGestao.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SistemaGestao.bat"
echo.
echo Concluido. A configuracao sera aplicada no proximo login.
pause
