/**
 * ArenaAI 2026 - Generative AI Engine
 * Handles calls to Google Gemini API (Live Mode) or streams local mock answers (Simulator Mode).
 */

import { SIMULATOR_DATABASE } from './prompts.js';

export class AIEngine {
  constructor() {
    this.apiKey = localStorage.getItem('arena_gemini_api_key') || '';
    this.isLiveMode = !!this.apiKey;
    this.activeModel = 'gemini-2.5-flash';
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    if (this.apiKey) {
      localStorage.setItem('arena_gemini_api_key', this.apiKey);
      this.isLiveMode = true;
    } else {
      localStorage.removeItem('arena_gemini_api_key');
      this.isLiveMode = false;
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  clearApiKey() {
    this.apiKey = '';
    localStorage.removeItem('arena_gemini_api_key');
    this.isLiveMode = false;
  }

  /**
   * Generates a streaming response.
   * @param {string} promptType - 'fanAssistant', 'opsAssistant', or 'sustainabilityAdvisor'
   * @param {string} userInput - The user's message/query
   * @param {string} systemPromptOverride - Custom system instructions
   * @param {function} onChunk - Callback triggered when a new text chunk is available: (text, done, error)
   */
  async generateStream(promptType, userInput, systemPromptOverride, onChunk) {
    if (this.isLiveMode) {
      await this.callGeminiAPIStream(systemPromptOverride, userInput, onChunk);
    } else {
      this.callSimulatorStream(promptType, userInput, onChunk);
    }
  }

  /**
   * Local high-fidelity NLP response simulator.
   * Simulates streaming output chunk by chunk to wows the user with dynamic UI animations.
   */
  callSimulatorStream(promptType, userInput, onChunk) {
    const rules = SIMULATOR_DATABASE[promptType] || [];
    const query = userInput.toLowerCase();
    
    // Find matching rule based on keywords
    let match = rules.find(rule => 
      rule.keywords && rule.keywords.some(kw => query.includes(kw))
    );

    // Fallback to default if no keywords match
    if (!match) {
      match = rules.find(rule => !rule.keywords);
    }

    const fullText = match ? match.response : `Simulator: Response ready. Recieved query: "${userInput}"`;
    
    // Stream simulation parameters
    let currentIdx = 0;
    const words = fullText.split(/(\s+)/); // Split keeping spaces
    
    const interval = setInterval(() => {
      if (currentIdx >= words.length) {
        clearInterval(interval);
        onChunk('', true, null); // Done
        return;
      }
      
      const chunk = words[currentIdx];
      currentIdx++;
      onChunk(chunk, false, null);
    }, 25); // ~40 words/sec streaming speed
  }

  /**
   * Direct fetch to official Google Gemini API stream endpoint.
   * Utilizes ReadableStream to read incoming chunks in real-time.
   */
  async callGeminiAPIStream(systemInstruction, userInput, onChunk) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.activeModel}:streamGenerateContent?key=${this.apiKey}`;
    
    const payload = {
      contents: [
        {
          parts: [
            { text: userInput }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          { text: systemInstruction }
        ]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP error ${response.status}`;
        throw new Error(errMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // The Gemini stream returns a JSON array of objects. We need to split and parse them.
        // Chunks are formatted as: [ { "candidates": ... }, { "candidates": ... } ]
        // A simple way is to parse the streaming text buffer using a regex or search.
        // Often chunks contain individual JSON fragments or a list. Let's process the stream buffer:
        let match;
        // Search for JSON objects containing text
        // Standard chunk format in stream is:
        // [
        //   { "candidates": [ { "content": { "parts": [ { "text": "..." } ] } } ] },
        //   ...
        // ]
        // Let's parse JSON fragments dynamically. A safe way is to find complete { ... } boundaries
        // or parse buffer.
        
        // Clean up brackets from SSE or array wrapper
        let cleanBuffer = buffer.trim();
        if (cleanBuffer.startsWith('[')) cleanBuffer = cleanBuffer.slice(1);
        if (cleanBuffer.endsWith(']')) cleanBuffer = cleanBuffer.slice(0, -1);
        
        // We split by ",\r\n" or ",\n" or standard delimiter to isolate JSON chunks
        const chunks = cleanBuffer.split(/\n\s*,\s*\n|\n\s*,\s*|,\s*\n/);
        
        // Check if the last chunk is potentially incomplete
        const lastIdx = chunks.length - 1;
        
        for (let i = 0; i < chunks.length; i++) {
          const chunkStr = chunks[i].trim();
          if (!chunkStr) continue;

          try {
            // Attempt to parse chunk. If it throws, it's incomplete; leave it in buffer.
            const parsed = JSON.parse(chunkStr);
            const textPart = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
              onChunk(textPart, false, null);
            }
            // If parsed successfully, we can clear this part from buffer
            // We reconstruct buffer later with only the unparsed final part
            if (i === lastIdx) {
              buffer = '';
            }
          } catch (e) {
            // Failed to parse, meaning it's incomplete. Keep it in the buffer.
            if (i === lastIdx) {
              // Re-align buffer to start with this incomplete chunk
              buffer = chunkStr;
            }
          }
        }
      }
      
      onChunk('', true, null); // Done stream
    } catch (err) {
      onChunk('', true, err);
    }
  }
}
