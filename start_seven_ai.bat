@echo off
echo Starting Seven AI with Llama 3.2 1B...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH. Please install Python first.
    pause
    exit /b 1
)

REM Check if required Python packages are installed
echo Installing required Python packages if needed...
pip install flask requests >nul 2>&1

REM Check if Ollama is installed and available
echo Checking Ollama installation...
ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama doesn't seem to be installed or isn't in your PATH.
    echo Please install Ollama from https://ollama.com/download
    echo After installing, run 'ollama pull llama3.2:1b' to download the model.
    pause
    exit /b 1
)

REM Start Ollama with Llama 3.2 1B in a new terminal window
echo Starting Ollama with Llama 3.2 1B model...
start cmd /k "echo Starting Ollama with Llama 3.2 1B... && ollama run llama3.2:1b"

REM Allow some time for Ollama to start
timeout /t 3 > nul

REM Start the Flask server in another terminal window
echo Starting the Python server...
start cmd /k "echo Starting Seven AI Python server... && python server.py"

REM Allow some time for the server to start
timeout /t 3 > nul

REM Open the web application in the default browser
echo Opening Seven AI in your browser...
start http://localhost:3000

echo.
echo Seven AI is now running!
echo To close all applications, close the browser and the terminal windows.
echo.

exit