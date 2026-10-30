import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google Gemini SDK on the server side
let defaultAi: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  defaultAi = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  if (customApiKey && customApiKey.trim().length > 0) {
    return new GoogleGenAI({
      apiKey: customApiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  if (!defaultAi) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please supply an API key in CreatorKit Settings or configure GEMINI_API_KEY.');
    }
    defaultAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return defaultAi;
}

// -------------------------------------------------------------
// AI Generation Endpoint
// -------------------------------------------------------------
app.post('/api/ai/generate', async (req, res) => {
  try {
    const {
      type, // 'ideas' | 'script' | 'hooks' | 'titles' | 'descriptions' | 'hashtags' | 'repurpose' | 'chat'
      prompt,
      systemInstruction,
      model = 'gemini-3.8-flash',
      provider = 'gemini',
      apiKey,
      baseUrl,
      temperature = 0.7,
      chatHistory = [],
    } = req.body;

    if (!prompt && (!chatHistory || chatHistory.length === 0)) {
      return res.status(400).json({ error: 'Prompt or chat history is required.' });
    }

    if (provider === 'gemini') {
      const ai = getGeminiClient(apiKey);
      
      if (type === 'chat' && Array.isArray(chatHistory) && chatHistory.length > 0) {
        // Multi-turn chat
        const contents = chatHistory.map((item: { role: string; content: string }) => ({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }],
        }));
        if (prompt) {
          contents.push({
            role: 'user',
            parts: [{ text: prompt }],
          });
        }

        const response = await ai.models.generateContent({
          model: model || 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: systemInstruction || 'You are CreatorKit AI, an expert digital content strategist, scriptwriter, and production assistant for YouTubers, TikTokers, podcasters, and streamers.',
            temperature,
          },
        });

        return res.json({
          text: response.text || '',
          provider: 'gemini',
          model: model || 'gemini-3.8-flash',
        });
      }

      // Standard text task
      const response = await ai.models.generateContent({
        model: model || 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || 'You are CreatorKit AI, an elite digital media production expert.',
          temperature,
        },
      });

      return res.json({
        text: response.text || '',
        provider: 'gemini',
        model: model || 'gemini-3.8-flash',
      });
    }

    if (provider === 'openai' || provider === 'openrouter' || provider === 'custom') {
      if (!apiKey) {
        return res.status(400).json({ error: `API key required for provider: ${provider}` });
      }
      
      const endpoint = baseUrl || (provider === 'openrouter' 
        ? 'https://openrouter.ai/api/v1/chat/completions' 
        : 'https://api.openai.com/v1/chat/completions');

      const messages: Array<{ role: string; content: string }> = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      if (chatHistory && chatHistory.length > 0) {
        chatHistory.forEach((msg: { role: string; content: string }) => {
          messages.push({ role: msg.role === 'model' ? 'assistant' : msg.role, content: msg.content });
        });
      }
      if (prompt) {
        messages.push({ role: 'user', content: prompt });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return res.status(response.status).json({ error: `Provider request failed (${response.status}): ${errorData}` });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return res.json({ text, provider, model });
    }

    if (provider === 'anthropic') {
      if (!apiKey) {
        return res.status(400).json({ error: 'Anthropic API key is required.' });
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: systemInstruction || 'You are CreatorKit AI, an expert digital content strategist.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Anthropic API error (${response.status}): ${errText}` });
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      return res.json({ text, provider, model });
    }

    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  } catch (error: any) {
    console.error('AI Generation error:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate AI response. Please check your provider settings or network connection.',
    });
  }
});

// -------------------------------------------------------------
// Provider Connection Test Endpoint
// -------------------------------------------------------------
app.post('/api/ai/test-connection', async (req, res) => {
  try {
    const { provider, apiKey, baseUrl, model } = req.body;

    if (provider === 'gemini') {
      const client = getGeminiClient(apiKey);
      const testModel = model || 'gemini-3.8-flash';
      const response = await client.models.generateContent({
        model: testModel,
        contents: 'Ping test. Reply with one word: Connected.',
      });
      return res.json({
        success: true,
        message: 'Successfully connected to Google Gemini.',
        model: testModel,
        response: response.text?.trim() || 'Connected',
      });
    }

    if (provider === 'openai' || provider === 'openrouter' || provider === 'custom') {
      if (!apiKey) {
        return res.status(400).json({ success: false, message: 'API key is required for connection test.' });
      }
      const endpoint = baseUrl || (provider === 'openrouter' 
        ? 'https://openrouter.ai/api/v1/chat/completions' 
        : 'https://api.openai.com/v1/chat/completions');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || (provider === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'),
          messages: [{ role: 'user', content: 'Ping test. Reply with: Connected.' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          success: false,
          message: `Connection failed (${response.status}): ${errorText}`,
        });
      }

      return res.json({
        success: true,
        message: `Successfully connected to ${provider}.`,
      });
    }

    if (provider === 'anthropic') {
      if (!apiKey) {
        return res.status(400).json({ success: false, message: 'API key is required for connection test.' });
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Ping test. Reply with: Connected.' }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          success: false,
          message: `Anthropic connection failed (${response.status}): ${errText}`,
        });
      }

      return res.json({
        success: true,
        message: 'Successfully connected to Anthropic Claude.',
      });
    }

    return res.status(400).json({ success: false, message: `Unsupported provider: ${provider}` });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Connection test failed.',
    });
  }
});

// -------------------------------------------------------------
// Audio Transcription Endpoint (Gemini gemini-3.5-transcribe)
// -------------------------------------------------------------
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/mp3', apiKey } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'Base64 encoded audioData is required.' });
    }

    const ai = getGeminiClient(apiKey);
    const audioPart = {
      inlineData: {
        mimeType,
        data: audioData.replace(/^data:[^;]+;base64,/, ''),
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this audio file accurately. Include timestamp approximations every 3 to 5 seconds in the format [MM:SS] Subtitle text.',
          },
        ],
      },
    });

    return res.json({
      transcript: response.text || '',
    });
  } catch (error: any) {
    console.error('Transcription error:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Transcription failed. Please verify that your audio format is supported.',
    });
  }
});

// -------------------------------------------------------------
// Social Platform Direct Publishing Simulation & Adapters
// -------------------------------------------------------------
app.post('/api/social/publish', async (req, res) => {
  try {
    const { platform, title, caption, mediaUrl, scheduledAt, hashtags = [] } = req.body;

    if (!platform) {
      return res.status(400).json({ error: 'Target platform is required.' });
    }

    // Platform validation checks
    const limits: Record<string, { maxCaption: number; allowsVideo: boolean; titleRequired: boolean }> = {
      youtube: { maxCaption: 5000, allowsVideo: true, titleRequired: true },
      instagram: { maxCaption: 2200, allowsVideo: true, titleRequired: false },
      tiktok: { maxCaption: 2200, allowsVideo: true, titleRequired: false },
      x: { maxCaption: 280, allowsVideo: true, titleRequired: false },
      linkedin: { maxCaption: 3000, allowsVideo: true, titleRequired: false },
      facebook: { maxCaption: 63206, allowsVideo: true, titleRequired: false },
    };

    const platformConfig = limits[platform.toLowerCase()];
    if (!platformConfig) {
      return res.status(400).json({ error: `Platform ${platform} is not currently supported.` });
    }

    if (platformConfig.titleRequired && (!title || title.trim().length === 0)) {
      return res.status(400).json({ error: `Title is mandatory for ${platform} publishing.` });
    }

    const fullCaption = `${caption || ''} ${hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')}`.trim();
    if (fullCaption.length > platformConfig.maxCaption) {
      return res.status(400).json({
        error: `Caption length (${fullCaption.length}) exceeds ${platform} limit of ${platformConfig.maxCaption} characters.`,
      });
    }

    const jobId = `pub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isScheduled = !!scheduledAt && new Date(scheduledAt).getTime() > Date.now();

    return res.json({
      success: true,
      jobId,
      platform,
      status: isScheduled ? 'scheduled' : 'published',
      scheduledAt: isScheduled ? scheduledAt : null,
      publishedAt: isScheduled ? null : new Date().toISOString(),
      platformPostId: `post_${Math.floor(Math.random() * 9000000 + 1000000)}`,
      platformPostUrl: platform === 'youtube'
        ? `https://youtube.com/watch?v=mock_${jobId}`
        : platform === 'x'
        ? `https://x.com/creator/status/mock_${jobId}`
        : `https://${platform}.com/p/mock_${jobId}`,
      message: isScheduled
        ? `Successfully scheduled post for ${new Date(scheduledAt).toLocaleString()}.`
        : `Successfully published to ${platform}.`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to process publishing request.' });
  }
});

// -------------------------------------------------------------
// Vite middleware integration (Dev) or Static files (Prod)
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`CreatorKit Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
