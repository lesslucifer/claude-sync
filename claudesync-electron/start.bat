@echo off
setlocal

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

:: Run the service installation script
%NODE_PATH% "%~dp0service.js"

echo Service initiated. Check the console output for details.
echo If successful, the service should start automatically.
pause