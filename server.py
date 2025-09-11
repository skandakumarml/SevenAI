from flask import Flask, request, jsonify, send_from_directory
import requests
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='./')
PORT = 3000

# Route for serving the main HTML page
@app.route('/')
def index():
    return send_from_directory('./', 'index.html')

# Route for serving static files (CSS, JS)
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('./', path)

# API endpoint to communicate with Llama model via Ollama
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '')
        conversation_id = data.get('conversationId', '')
        
        # Log request
        logger.info(f"Received message for conversation {conversation_id}: {message}")
        
        # Call Ollama API for Llama 3.2
        ollama_response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': 'llama3.2',
                'prompt': message,
                'stream': False
            }
        )
        
        if ollama_response.status_code != 200:
            raise Exception(f"Ollama API error: {ollama_response.status_code}")
        
        response_data = ollama_response.json()
        ai_response = response_data.get('response', '')
        
        # Log response (truncated for brevity)
        truncated_response = ai_response[:100] + '...' if len(ai_response) > 100 else ai_response
        logger.info(f"Received response from Ollama: {truncated_response}")
        
        # Send response back to client
        return jsonify({
            'response': ai_response,
            'conversationId': conversation_id
        })
    
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            'error': 'Failed to process your request',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    logger.info(f"Server running on http://localhost:{PORT}")
    logger.info("Make sure Ollama is running with 'ollama run llama3.2:1b' in another terminal")
    app.run(host='0.0.0.0', port=PORT, debug=True)