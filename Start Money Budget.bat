@echo off
rem Launches the Money Budget app and opens it in your browser.
rem Build first with: cd backend && mvn package -DskipTests

set JAR=%~dp0backend\target\budget-app-backend.jar

if not exist "%JAR%" (
    echo Jar not found. Build it first:
    echo   cd backend ^&^& mvn package -DskipTests
    pause
    exit /b 1
)

rem Run from the backend folder so .env and the data/ folder are found
cd /d "%~dp0backend"

rem javaw = no console window stays open
start "Money Budget" javaw -jar "%JAR%"

echo Starting Money Budget...
timeout /t 8 /nobreak >nul

rem Open in app mode: standalone window, no address bar or tabs.
rem Tries Chrome first, falls back to Edge (always present on Windows 11).
start chrome --app=http://localhost:8600 2>nul || start msedge --app=http://localhost:8600
exit /b 0
