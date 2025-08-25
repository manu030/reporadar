const OpenAI = require('openai');

// Initialize OpenAI client
let client = null;
let aiEnabled = false;

function initializeAI() {
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  const isValidKey = (key) => key && key.length > 10 && !key.includes('placeholder') && !key.includes('your_');
  
  if (openrouterApiKey && isValidKey(openrouterApiKey)) {
    client = new OpenAI({
      apiKey: openrouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1'
    });
    aiEnabled = true;
  } else if (openaiApiKey && isValidKey(openaiApiKey)) {
    client = new OpenAI({
      apiKey: openaiApiKey
    });
    aiEnabled = true;
  } else {
    aiEnabled = false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, targetLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Text and targetLanguage are required' });
  }

  if (!aiEnabled) {
    initializeAI();
  }

  if (!aiEnabled) {
    return res.status(503).json({ error: 'Translation service not available' });
  }

  try {
    const prompt = targetLanguage === 'Spanish' ?
      `Traduce el siguiente texto técnico de un repositorio de GitHub al español de manera natural y profesional. Mantén términos técnicos cuando sea apropiado:

"${text}"

Responde solo con la traducción, sin comillas ni formato adicional.` :
      `Translate the following technical text from a GitHub repository to English naturally and professionally. Keep technical terms when appropriate:

"${text}"

Reply only with the translation, no quotes or additional formatting.`;

    const models = client.baseURL?.includes('openrouter') ? [
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.1-70b-instruct',
      'mistralai/mixtral-8x7b-instruct'
    ] : ['gpt-4o-mini'];

    for (const model of models) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.3
        });

        const translation = response.choices[0]?.message?.content?.trim();
        
        if (translation && translation.length > 10 && translation.length < 300) {
          console.log(`✅ Translation completed: ${text.substring(0, 30)}... → ${translation.substring(0, 30)}...`);
          return res.status(200).json({ 
            success: true, 
            translation: translation,
            originalText: text,
            targetLanguage: targetLanguage
          });
        }
      } catch (modelError) {
        console.warn(`⚠️ Model ${model} failed for translation:`, modelError.message);
        continue;
      }
    }

    // If all models fail, return original text
    return res.status(200).json({ 
      success: false, 
      translation: text, // Fallback to original
      error: 'Translation failed, returning original text' 
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return res.status(500).json({ 
      error: 'Translation service error',
      translation: text // Fallback to original
    });
  }
}