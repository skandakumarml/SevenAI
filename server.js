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

// Route for serving the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to communicate with Llama model via Ollama
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    // Log request
    console.log(`Received message for conversation ${conversationId}: ${message}`);
    
    // Call Ollama API for Llama 3.2
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        prompt: message,
        stream: false
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`);
    }
    
    const responseData = await ollamaResponse.json();
    
    // Log response (truncated for brevity)
    console.log(`Received response from Ollama: ${responseData.response.substring(0, 100)}...`);

    // Send response back to client
    res.json({
      response: responseData.response,
      conversationId
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