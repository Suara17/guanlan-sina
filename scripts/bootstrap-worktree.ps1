[CmdletBinding()]
param(
    [string]$EnvTemplate = ".env.localdev.example",
    [string]$SharedRoot = ".shared",
    [string]$Neo4jExcelPath = "docs\知识图谱\data2.xlsx",
    [switch]$RefreshEnv,
    [switch]$UseBackendTemplate,
    [switch]$UseFrontendTemplate,
    [switch]$SkipInstall,
    [switch]$SkipServices,
    [switch]$SkipMigrate,
    [switch]$SkipNeo4jImport,
    [switch]$StartApps
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot "backend"
$frontendRoot = Join-Path $repoRoot "frontend"
$envPath = Join-Path $repoRoot ".env"
$envTemplatePath = Join-Path $repoRoot $EnvTemplate
$sharedBackendVenv = Join-Path $repoRoot (Join-Path $SharedRoot "backend-venv")
$sharedFrontendModules = Join-Path $repoRoot (Join-Path $SharedRoot "frontend-node_modules")
$backendVenv = Join-Path $backendRoot ".venv"
$frontendModules = Join-Path $frontendRoot "node_modules"
$backendPython = Join-Path $backendVenv "Scripts\python.exe"
$resolvedNeo4jExcelPath = Join-Path $repoRoot $Neo4jExcelPath

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-External {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [string[]]$ArgumentList = @(),
        [string]$WorkingDirectory = $repoRoot
    )

    Push-Location $WorkingDirectory
    try {
        & $FilePath @ArgumentList
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed: $FilePath $($ArgumentList -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

function Assert-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

function Wait-ForTcpPort {
    param(
        [string]$Host,
        [int]$Port,
        [int]$TimeoutSeconds = 120
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $client = New-Object System.Net.Sockets.TcpClient
        try {
            $asyncResult = $client.BeginConnect($Host, $Port, $null, $null)
            if ($asyncResult.AsyncWaitHandle.WaitOne(1000, $false) -and $client.Connected) {
                $client.EndConnect($asyncResult)
                return
            }
        }
        catch {
        }
        finally {
            $client.Dispose()
        }

        Start-Sleep -Seconds 2
    }

    throw "Timed out waiting for $Host`:$Port"
}

function Copy-TemplateDirectory {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path $Source)) {
        throw "Template directory not found: $Source"
    }

    Write-Host "Copying template $Source -> $Destination"
    Copy-Item -Path $Source -Destination $Destination -Recurse -Force
}

Write-Step "Preparing local environment file"
if ($RefreshEnv -or -not (Test-Path $envPath)) {
    if (-not (Test-Path $envTemplatePath)) {
        throw "Environment template not found: $envTemplatePath"
    }

    Copy-Item -Path $envTemplatePath -Destination $envPath -Force
    Write-Host "Created .env from $EnvTemplate"
}
else {
    Write-Host ".env already exists, keeping current file"
}

if (-not $SkipInstall) {
    Write-Step "Preparing backend dependencies"
    if (Test-Path $backendVenv) {
        Write-Host "backend/.venv already exists"
    }
    elseif ($UseBackendTemplate -and (Test-Path $sharedBackendVenv)) {
        Copy-TemplateDirectory -Source $sharedBackendVenv -Destination $backendVenv
    }
    else {
        Assert-Command "uv"
        Invoke-External -FilePath "uv" -ArgumentList @("sync", "--frozen", "--offline") -WorkingDirectory $backendRoot
    }

    Write-Step "Preparing frontend dependencies"
    if (Test-Path $frontendModules) {
        Write-Host "frontend/node_modules already exists"
    }
    elseif ($UseFrontendTemplate -and (Test-Path $sharedFrontendModules)) {
        Copy-TemplateDirectory -Source $sharedFrontendModules -Destination $frontendModules
    }
    else {
        Assert-Command "npm"
        Invoke-External -FilePath "npm" -ArgumentList @("ci", "--prefer-offline", "--no-audit", "--fund", "false") -WorkingDirectory $frontendRoot
    }
}

if (-not (Test-Path $backendPython)) {
    throw "Backend Python interpreter not found: $backendPython"
}

if (-not $SkipServices) {
    Write-Step "Starting PostgreSQL and Neo4j"
    Assert-Command "docker"
    Invoke-External -FilePath "docker" -ArgumentList @("compose", "-f", "docker-compose.local.yml", "up", "-d", "db")
    Invoke-External -FilePath "docker" -ArgumentList @("compose", "up", "-d", "neo4j")

    Write-Host "Waiting for PostgreSQL on localhost:5432"
    Wait-ForTcpPort -Host "localhost" -Port 5432
    Write-Host "Waiting for Neo4j on localhost:7687"
    Wait-ForTcpPort -Host "localhost" -Port 7687
}

if (-not $SkipMigrate) {
    Write-Step "Running Alembic migrations and initial data"
    Invoke-External -FilePath $backendPython -ArgumentList @("-m", "alembic", "upgrade", "head") -WorkingDirectory $backendRoot
    Invoke-External -FilePath $backendPython -ArgumentList @("app\initial_data.py") -WorkingDirectory $backendRoot
}

if (-not $SkipNeo4jImport) {
    Write-Step "Importing Neo4j Excel data"
    if (Test-Path $resolvedNeo4jExcelPath) {
        Invoke-External -FilePath $backendPython -ArgumentList @(
            "-m",
            "app.scripts.import_neo4j_excel",
            "--excel-path",
            $resolvedNeo4jExcelPath
        ) -WorkingDirectory $backendRoot
    }
    else {
        Write-Warning "Neo4j Excel file not found, skipped: $resolvedNeo4jExcelPath"
    }
}

if ($StartApps) {
    Write-Step "Starting local backend and frontend"
    $backendCommand = "& '$backendPython' -m fastapi dev app/main.py"
    $frontendCommand = "npm run dev"

    Start-Process powershell -WorkingDirectory $backendRoot -ArgumentList @("-NoExit", "-Command", $backendCommand)
    Start-Process powershell -WorkingDirectory $frontendRoot -ArgumentList @("-NoExit", "-Command", $frontendCommand)
}

Write-Step "Bootstrap completed"
Write-Host "Backend env: $backendVenv"
Write-Host "Frontend deps: $frontendModules"
Write-Host "Environment file: $envPath"
