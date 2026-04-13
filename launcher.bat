@echo off
setlocal

cd /d "%~dp0"

echo docx-from-html
echo.

if not exist "node_modules\" (
  echo Dependencies not found. Running npm install...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
  echo.
)

node src\index.js
echo.
pause
