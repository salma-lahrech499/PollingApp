# How to Kill a Process Using a Port (Windows)

## Quick Method (PowerShell - Recommended)

### Step 1: Find the Process ID (PID)
```powershell
Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess
```

Or using netstat:
```powershell
netstat -ano | findstr :4000
```
This will show output like:
```
TCP    0.0.0.0:4000           0.0.0.0:0              LISTENING       19068
```
The last number (19068) is the Process ID (PID).

### Step 2: Kill the Process
```powershell
Stop-Process -Id <PID> -Force
```

**Example:**
```powershell
Stop-Process -Id 19068 -Force
```

## Using the Helper Script

I've created a PowerShell script `kill-port.ps1` that does both steps:

```powershell
.\kill-port.ps1 -Port 4000
```

## Command Prompt Method

### Step 1: Find the Process ID
```cmd
netstat -ano | findstr :4000
```

### Step 2: Kill the Process
```cmd
taskkill /F /PID <PID>
```

**Example:**
```cmd
taskkill /F /PID 19068
```

## One-Liner Commands

### PowerShell One-Liner
```powershell
Get-NetTCPConnection -LocalPort 4000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

### Command Prompt One-Liner
```cmd
for /f "tokens=5" %a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do taskkill /F /PID %a
```

## Common Ports Used in This Project

- **Port 4000**: GraphQL Server
- **Port 3000**: React Dev Server

## Tips

1. **Always use -Force** when killing processes to ensure they terminate immediately
2. **Check if port is free** after killing: `netstat -ano | findstr :4000`
3. **If you get "Access Denied"**, run PowerShell/Command Prompt as Administrator

