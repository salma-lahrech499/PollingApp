# PowerShell script to kill a process using a specific port
param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Finding process using port $Port..." -ForegroundColor Yellow

$process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    $processId = $process | Select-Object -First 1
    $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
    
    Write-Host "Process found: PID $processId ($processName)" -ForegroundColor Cyan
    Write-Host "Killing process..." -ForegroundColor Yellow
    
    Stop-Process -Id $processId -Force
    
    Write-Host "Process killed successfully!" -ForegroundColor Green
} else {
    Write-Host "No process found using port $Port" -ForegroundColor Red
}

