@echo off
setlocal
rem Launches the Money Budget app and opens it in its own window.
rem Build first with:  cd frontend && npm run build  then  cd backend && mvn package -DskipTests

set JAR=%~dp0backend\target\budget-app-backend.jar
set PORT=8600

if not exist "%JAR%" (
    echo Jar not found. Build it first:
    echo   cd frontend ^&^& npm run build
    echo   cd backend ^&^& mvn package -DskipTests
    pause
    exit /b 1
)

rem If the app is already running, just open the window
call :checkport
if %errorlevel%==0 (
    echo Money Budget is already running.
    goto open
)

rem Run from the backend folder so .env and the data/ folder are found
cd /d "%~dp0backend"
start "Money Budget" javaw -jar "%JAR%"
echo Starting Money Budget...

rem Wait until the app answers (up to ~60s)
set tries=0
:wait
set /a tries+=1
call :checkport
if %errorlevel%==0 goto open
if %tries% geq 30 (
    echo App did not start in time. Check backend\data\logs\app.log
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul
goto wait

:open
start "" chrome --app=http://localhost:%PORT% 2>nul || start "" msedge --app=http://localhost:%PORT%
exit /b 0

:checkport
powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient;try{$c.Connect('127.0.0.1',%PORT%);$c.Close();exit 0}catch{exit 1}" >nul 2>&1
exit /b %errorlevel%
