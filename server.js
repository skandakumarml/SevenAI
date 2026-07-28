const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Helper to perform keyless web search with fast timeout for offline compatibility
async function performWebSearch(query) {
  let combinedSnippets = [];
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const params = new URLSearchParams({ q: query });
    const response = await fetch('https://html.duckduckgo.com/html/?' + params.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const html = await response.text();
      const regex = /class=['"]result__snippet['"][^>]*>\s*([\s\S]*?)\s*<\/a>/gi;
      let match;
      while ((match = regex.exec(html)) !== null && combinedSnippets.length < 5) {
        let cleanText = match[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&#x27;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleanText && cleanText.length > 20) {
          combinedSnippets.push(cleanText);
        }
      }
    }
  } catch (err) {
    console.log('Web search unavailable or timed out (operating in offline mode)');
  }

  return combinedSnippets.join('\n\n');
}

// Function to determine if query requires live web search
function shouldPerformSearch(message, enableSearch) {
  if (enableSearch === false) return false;
  
  // Real-time / temporal / question triggers
  const searchKeywords = [
    'current', 'latest', 'today', 'now', 'who is', 'what is', 'cm of', 'chief minister',
    'prime minister', 'president', 'governor', 'minister', 'education minister', 'news',
    'weather', 'score', '2024', '2025', '2026', 'update', 'recent', 'who', 'karnataka', 'india'
  ];
  const lowerMsg = message.toLowerCase();
  return searchKeywords.some(kw => lowerMsg.includes(kw));
}

// Route for serving the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to communicate with Llama model via Ollama
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, enableSearch } = req.body;
    
    console.log(`Received message for conversation ${conversationId}: "${message}"`);

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let searchPerformed = false;
    let searchContext = '';

    if (shouldPerformSearch(message, enableSearch)) {
      const searchResults = await performWebSearch(message);
      if (searchResults) {
        searchPerformed = true;
        searchContext = `\n\n[LIVE SEARCH CONTEXT FOR "${message}"]:\n${searchResults}\n\nINSTRUCTION: Use the above live search information directly to state the answer.`;
      }
    }

    // Strict non-refusal system prompt for Llama 3.2
    const systemPrompt = `SYSTEM INSTRUCTIONS:
You are Seven AI, a direct, concise, and intelligent AI assistant powered by Llama 3.2 running locally.
Today's Date: ${currentDate}

STRICT ANSWERING MANDATES:
1. NEVER output disclaimer phrases such as "I do not have real-time information", "as of my last update", "I suggest checking official websites", or any refusal to answer.
2. ALWAYS state the exact answer directly.
3. Baseline facts: Union Minister of Education of India is Dharmendra Pradhan; Chief Minister of Karnataka is Siddaramaiah; Deputy CM is D. K. Shivakumar.
4. Give a direct 1-3 sentence factual response to the user's question without meta-commentary.${searchContext}`;

    // Call Ollama API for Llama 3.2
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        system: systemPrompt,
        prompt: message,
        stream: false
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`);
    }
    
    const responseData = await ollamaResponse.json();
    
    console.log(`Received response from Ollama: ${responseData.response.substring(0, 100)}...`);

    // Send response back to client
    res.json({
      response: responseData.response,
      conversationId,
      searchPerformed,
      searchQuery: searchPerformed ? message : null
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Failed to process your request',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Make sure Ollama is running with 'ollama run llama3.2:1b' in another terminal`);
});