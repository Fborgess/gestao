# restore.ps1 - Restaura um backup .dump (pg_restore).
# Uso:
#   Listar backups:            powershell -ExecutionPolicy Bypass -File restore.ps1 -List
#   Restaurar o mais recente:  powershell -ExecutionPolicy Bypass -File restore.ps1
#   Restaurar um especifico:   powershell -ExecutionPolicy Bypass -File restore.ps1 -Path <arquivo.dump>
#   Destino: -DbUrl <connection string> (padrao: DATABASE_URL de backend\.env)
#            -BackupRoot <pasta> (padrao: %USERPROFILE%\gestao-backups)

param(
    [string]$Path,
    [switch]$List,
    [string]$BackupRoot = (Join-Path $env:USERPROFILE 'gestao-backups'),
    [string]$DbUrl,
    [string]$EnvDir = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$ErrorActionPreference = 'Stop'

$pgRestore = (Get-Command pg_restore -ErrorAction Stop).Source

if ($List) {
    Write-Output "=== Local ==="
    Get-ChildItem -Path (Join-Path $BackupRoot 'local') -Filter *.dump -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | ForEach-Object { Write-Output ("{0}  {1} MB" -f $_.Name, [math]::Round($_.Length/1MB, 2)) }
    Write-Output "=== Producao ==="
    Get-ChildItem -Path (Join-Path $BackupRoot 'prod') -Filter *.dump -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | ForEach-Object { Write-Output ("{0}  {1} MB" -f $_.Name, [math]::Round($_.Length/1MB, 2)) }
    exit 0
}

if (-not $Path) {
    $Path = Get-ChildItem -Path (Join-Path $BackupRoot 'local') -Filter *.dump -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $Path -or -not (Test-Path -LiteralPath $Path)) {
    Write-Error "Nenhum backup encontrado. Use -Path para indicar o arquivo."
    exit 1
}

if (-not $DbUrl) {
    $line = Get-Content -LiteralPath (Join-Path $EnvDir 'backend\.env') | Where-Object { $_ -match "^DATABASE_URL=" } | Select-Object -First 1
    $DbUrl = ($line -replace "^DATABASE_URL=", '').Trim().Trim('"', "'")
}
if (-not $DbUrl) {
    Write-Error "Informe -DbUrl com a connection string do banco de destino."
    exit 1
}

Write-Output "Restaurando $Path em $DbUrl ..."
Write-Output "ATENCAO: isto SOBRESCREVE os dados do banco de destino."
$confirm = Read-Host "Digite RESTAURAR para confirmar"
if ($confirm -ne 'RESTAURAR') {
    Write-Output "Cancelado."
    exit 0
}

& $pgRestore -d $DbUrl --clean --if-exists --no-owner $Path 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_restore falhou (exit $LASTEXITCODE). Detalhes acima."
    exit 1
}
Write-Output "Restauracao concluida."
