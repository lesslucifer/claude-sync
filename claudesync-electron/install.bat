@echo off
setlocal

:: Check if running with admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

:: Set the path to the Node.js executable
where node > nul 2>&1
if %errorlevel% equ 0 (
    set NODE_PATH=node
) else (
    :: If node is not in PATH, try common installation directories
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set NODE_PATH="%ProgramFiles%\nodejs\node.exe"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set NODE_PATH="%ProgramFiles(x86)%\nodejs\node.exe"
    ) else (
        echo Node.js is not found. Please install Node.js or add it to your PATH.
        pause
        exit /b 1
    )
)

:: Install required npm package if not already installed
if not exist "%~dp0node_modules\node-windows" (
    echo Installing node-windows package...
    call npm install node-windows
)

:: Run the service installation script
%NODE_PATH% "%~dp0install-service.js"

echo Service installation initiated. Check the console output for details.
echo If successful, the service should start automatically.
pause