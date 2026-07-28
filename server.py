from flask import Flask, request, jsonify, send_from_directory
import requests
import os
import re
import logging
from datetime import datetime
from html import unescape

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='./')
PORT = 3000

def perform_web_search(query):
    snippets = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        res = requests.get('https://html.duckduckgo.com/html/', params={'q': query}, headers=headers, timeout=2.5)
        if res.status_code == 200:
            matches = re.findall(r"class=['\"]result__snippet['\"][^>]*>\s*([\s\S]*?)\s*<\/a>", res.text, re.IGNORECASE)
            for match in matches[:5]:
                clean_text = re.sub(r'<[^>]+>', '', match)
                clean_text = unescape(clean_text)
                clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                if clean_text and len(clean_text) > 20:
                    snippets.append(clean_text)
    except Exception as e:
        logger.info("Web search unavailable or timed out (operating in offline mode)")
            
    return "\n\n".join(snippets)

def should_perform_search(message, enable_search):
    if enable_search is False:
        return False
        
    keywords = [
        'current', 'latest', 'today', 'now', 'who is', 'what is', 'cm of', 'chief minister',
        'prime minister', 'president', 'governor', 'minister', 'education minister', 'news',
        'weather', 'score', '2024', '2025', '2026', 'update', 'recent', 'who', 'karnataka', 'india'
    ]
    lower_msg = message.lower()
    return any(kw in lower_msg for kw in keywords)

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
        enable_search = data.get('enableSearch', None)
        
        logger.info(f"Received message for conversation {conversation_id}: '{message}'")
        
        current_date = datetime.now().strftime("%A, %B %d, %Y")
        search_performed = False
        search_context = ""
        
        if should_perform_search(message, enable_search):
            search_results = perform_web_search(message)
            if search_results:
                search_performed = True
                search_context = f"\n\n[LIVE SEARCH CONTEXT FOR '{message}']:\n{search_results}\n\nINSTRUCTION: Use the above live search information directly to state the answer."
                
        system_prompt = f"""SYSTEM INSTRUCTIONS:
You are Seven AI, a direct, concise, and intelligent AI assistant powered by Llama 3.2 running locally.
Today's Date: {current_date}

STRICT ANSWERING MANDATES:
1. NEVER output disclaimer phrases such as "I do not have real-time information", "as of my last update", "I suggest checking official websites", or any refusal to answer.
2. ALWAYS state the exact answer directly.
3. Baseline facts: Union Minister of Education of India is Dharmendra Pradhan; Chief Minister of Karnataka is Siddaramaiah; Deputy CM is D. K. Shivakumar.
4. Give a direct 1-3 sentence factual response to the user's question without meta-commentary.{search_context}"""
        
        # Call Ollama API for Llama 3.2
        ollama_response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': 'llama3.2',
                'system': system_prompt,
                'prompt': message,
                'stream': False
            }
        )
        
        if ollama_response.status_code != 200:
            raise Exception(f"Ollama API error: {ollama_response.status_code}")
        
        response_data = ollama_response.json()
        ai_response = response_data.get('response', '')
        
        truncated_response = ai_response[:100] + '...' if len(ai_response) > 100 else ai_response
        logger.info(f"Received response from Ollama: {truncated_response}")
        
        return jsonify({
            'response': ai_response,
            'conversationId': conversation_id,
            'searchPerformed': search_performed,
            'searchQuery': message if search_performed else None
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