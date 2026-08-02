# backup.ps1 - Backup automatico do banco de dados (local + producao Render).
# Uso: powershell -ExecutionPolicy Bypass -File backup.ps1
# Parametros: -Keep <N> (quantos backups manter por origem, padrao 10)
#             -BackupRoot <caminho> (pasta de destino; padrao %USERPROFILE%\gestao-backups)
#             -EnvDir <caminho> (pasta do projeto; padrao: raiz deste script)
#
# Nota: o pg_dump/pg_restore no Windows usa codepage ANSI e nao acessa caminhos
# com caracteres nao-ASCII. Por isso o destino padrao e um caminho ASCII fora
# do OneDrive ("C:\Users\<usuario>\gestao-backups").

param(
    [int]$Keep = 10,
    [string]$BackupRoot = (Join-Path $env:USERPROFILE 'gestao-backups'),
    [string]$EnvDir = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [string]$PgDump18 = ''
)

$ErrorActionPreference = 'Stop'

$pgDump = (Get-Command pg_dump -ErrorAction Stop).Source
# Producao Render roda PostgreSQL 18; o pg_dump do sistema (16) nao suporta.
# Se um pg_dump 18 estiver disponivel (tools\pg18), usa-se ele para a producao.
$toolsPgDump18 = Join-Path $BackupRoot 'tools\pg18\pgsql\bin\pg_dump.exe'
if (-not $PgDump18 -and (Test-Path -LiteralPath $toolsPgDump18)) { $PgDump18 = $toolsPgDump18 }
$localDir = Join-Path $BackupRoot 'local'
$prodDir = Join-Path $BackupRoot 'prod'
$logFile = Join-Path $BackupRoot 'backup.log'
New-Item -ItemType Directory -Force -Path $localDir, $prodDir | Out-Null

function Write-Log([string]$msg) {
    $line = "{0} {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Write-Output $line
    Add-Content -Path $logFile -Value $line
}

function Get-EnvValue([string]$file, [string]$key) {
    if (-not (Test-Path -LiteralPath $file)) { return $null }
    $line = Get-Content -LiteralPath $file | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
    if (-not $line) { return $null }
    return ($line -replace "^$key=", '').Trim().Trim('"', "'")
}

function Invoke-Dump([string]$exe, [string]$url, [string]$outFile, [string]$label) {
    if (-not $url) { return $false }
    & $exe -d $url -Fc -f $outFile --no-owner 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $outFile)) {
        Write-Log "ERRO no dump $label (pg_dump exit $LASTEXITCODE)"
        return $false
    }
    $size = "{0:N2} MB" -f ((Get-Item -LiteralPath $outFile).Length / 1MB)
    Write-Log "Backup $label OK: $outFile ($size)"
    return $true
}

function Invoke-Rotation([string]$dir) {
    $files = Get-ChildItem -Path $dir -Filter *.dump -File | Sort-Object LastWriteTime -Descending
    $toRemove = $files | Select-Object -Skip $Keep
    foreach ($f in $toRemove) {
        Remove-Item -LiteralPath $f.FullName -Force
        Write-Log "Rotacao: removido $($f.FullName)"
    }
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

# ---- Backup local (Postgres em .env) ----
$localUrl = Get-EnvValue (Join-Path $EnvDir 'backend\.env') 'DATABASE_URL'
if (-not $localUrl) {
    Write-Log "AVISO: DATABASE_URL local nao encontrado em backend\.env; backup local ignorado"
} else {
    $ok = Invoke-Dump $pgDump $localUrl (Join-Path $localDir "gestao-local-$stamp.dump") 'local'
    if ($ok) { Invoke-Rotation $localDir }
}

# ---- Backup de producao (Render, via backup.env) ----
$prodUrl = Get-EnvValue (Join-Path $EnvDir 'backup.env') 'PROD_DATABASE_URL'
if (-not $prodUrl) {
    Write-Log "INFO: PROD_DATABASE_URL nao configurado em backup.env; backup de producao ignorado"
} else {
    $prodDump = if ($PgDump18) { $PgDump18 } else {
        Write-Log "AVISO: pg_dump 18 nao encontrado em $toolsPgDump18; tentando pg_dump do sistema (pode falhar com PostgreSQL 18)"
        $pgDump
    }
    $ok = Invoke-Dump $prodDump $prodUrl (Join-Path $prodDir "gestao-prod-$stamp.dump") 'producao'
    if ($ok) { Invoke-Rotation $prodDir }
}

# ---- Espelho para o OneDrive (redundancia fora deste disco) ----
$oneDrive = @($env:OneDriveConsumer, $env:OneDrive) | Where-Object { $_ } | Select-Object -First 1
if ($oneDrive -and (Test-Path -LiteralPath $oneDrive)) {
    $mirrorRoot = Join-Path $oneDrive 'gestao-backups-mirror'
    $mirrorLocal = Join-Path $mirrorRoot 'local'
    $mirrorProd = Join-Path $mirrorRoot 'prod'
    New-Item -ItemType Directory -Force -Path $mirrorLocal, $mirrorProd | Out-Null
    $newestLocal = Get-ChildItem -Path $localDir -Filter *.dump -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($newestLocal) {
        Copy-Item -LiteralPath $newestLocal.FullName -Destination (Join-Path $mirrorLocal $newestLocal.Name) -Force
        Write-Log "Espelho OneDrive: $($newestLocal.Name)"
    }
    $newestProd = Get-ChildItem -Path $prodDir -Filter *.dump -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($newestProd) {
        Copy-Item -LiteralPath $newestProd.FullName -Destination (Join-Path $mirrorProd $newestProd.Name) -Force
        Write-Log "Espelho OneDrive: $($newestProd.Name)"
    }
    Invoke-Rotation $mirrorLocal
    Invoke-Rotation $mirrorProd
} else {
    Write-Log "AVISO: OneDrive nao encontrado; espelho ignorado"
}

Write-Log "Backup concluido."
