$emoji = [char]0xD83D + [char]0xDCC1
$proj = "C:\Users\fsbor\OneDrive\Borges\Backup $emoji\Documentos\Default Project"

Write-Host "=== Sistema Gestao - Status ===" -ForegroundColor Cyan

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -eq "Wi-Fi" }).IPAddress
Write-Host "IP Local: $ip" -ForegroundColor Yellow
Write-Host "Hostname: $env:COMPUTERNAME" -ForegroundColor Yellow
Write-Host ""
Write-Host "URLs para acessar:" -ForegroundColor Green
Write-Host "  Frontend: http://${ip}:5173" -ForegroundColor Green
Write-Host "  Backend:  http://${ip}:8000" -ForegroundColor Green
Write-Host "  Hostname: http://${env:COMPUTERNAME}:5173" -ForegroundColor Green
Write-Host ""

$procs = Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -match "uvicorn" }
if ($procs) {
    Write-Host "Backend: Rodando (PID $($procs.ProcessId))" -ForegroundColor Green
} else {
    Write-Host "Backend: PARADO!" -ForegroundColor Red
}

$vite = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match "vite" }
if ($vite) {
    Write-Host "Frontend: Rodando (PID $($vite.ProcessId))" -ForegroundColor Green
} else {
    Write-Host "Frontend: PARADO!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testando conexao..." -ForegroundColor Cyan
try { $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing -TimeoutSec 3; Write-Host "  Backend API: OK ($($r.StatusCode))" -ForegroundColor Green } catch { Write-Host "  Backend API: FALHA" -ForegroundColor Red }
try { $r = Invoke-WebRequest -Uri "http://127.0.0.1:5173" -UseBasicParsing -TimeoutSec 3; Write-Host "  Vite:       OK ($($r.StatusCode))" -ForegroundColor Green } catch { Write-Host "  Vite:       FALHA" -ForegroundColor Red }
