#!/bin/bash

echo "Starting Seven AI with Llama 3.2..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python is not installed. Please install Python first."
    exit 1
fi

# Start Ollama with Llama 3.2 in a new terminal
echo "Starting Ollama with Llama 3.2 model..."
osascript -e 'tell app "Terminal" to do script "ollama run llama3.2"' &

# Wait a bit for Ollama to start
sleep 3

# Start the Flask server in another terminal with debug mode
echo "Starting the Python server..."
PYTHON_PATH="/Users/skandakumarml/Desktop/Original Copy Seven 3.0/Original Copy Seven/.venv/bin/python"
export FLASK_ENV=development
export FLASK_DEBUG=1
osascript -e "tell app \"Terminal\" to do script \"cd '$(pwd)' && export FLASK_ENV=development && export FLASK_DEBUG=1 && '$PYTHON_PATH' server.py\"" &

# Wait a bit for the server to start
sleep 3

# Open the web application in the default browser
echo "Opening Seven AI in your browser..."
open "http://localhost:3000"

echo
echo "Seven AI is now running!"
echo "To close all applications, close the browser and the terminal windows."
echo
