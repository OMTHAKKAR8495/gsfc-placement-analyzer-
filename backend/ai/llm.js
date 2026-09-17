import dotenv from 'dotenv';
dotenv.config();

/**
 * Robust JSON extraction helper from LLM output
 */
export async function cleanJsonOutput(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonSub = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSub);
    }
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      const jsonSub = cleaned.substring(firstBracket, lastBracket + 1);
      return JSON.parse(jsonSub);
    }
    throw new Error(`Failed to parse AI JSON response: ${e.message}`);
  }
}

/**
 * Fast, non-blocking LLM caller with OmniRoute AI gateway & Gemini support
 */
export async function callLLM({ prompt, schemaDescription, fallbackGenerator }) {
  const gatewayUrl = process.env.AI_GATEWAY_URL || process.env.OPENAI_BASE_URL;
  const gatewayKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const gatewayModel = process.env.AI_MODEL || 'auto';

  // 1. Attempt OmniRoute / OpenAI-compatible AI Gateway
  if (gatewayUrl && gatewayKey) {
    try {
      const endpoint = `${gatewayUrl.replace(/\/$/, '')}/chat/completions`;
      const fullPrompt = `${prompt}\n\nIMPORTANT INSTRUCTION: Respond strictly with valid JSON conforming to this schema:\n${schemaDescription}`;

      const timeoutMs = process.env.AI_TIMEOUT_MS ? parseInt(process.env.AI_TIMEOUT_MS, 10) : 5000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayKey}`
        },
        body: JSON.stringify({
          model: gatewayModel,
          messages: [
            { role: 'system', content: 'You are an enterprise career and placement evaluation AI. Respond strictly in valid JSON format.' },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.2
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content) {
          return cleanJsonOutput(content);
        }
      }
    } catch (err) {
      console.warn(`[AI Engine] OmniRoute Gateway notice: ${err.message}. Falling back.`);
    }
  }

  // 2. Attempt Google Gemini API call if key is provided
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey && geminiKey.length > 10 && !geminiKey.includes('YOUR_')) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const ai = new GoogleGenerativeAI(geminiKey);
      const targetModelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
      const model = ai.getGenerativeModel({ model: targetModelName });
      
      const fullPrompt = `${prompt}\n\nIMPORTANT INSTRUCTION: Respond strictly with valid JSON. Do not include markdown headers or commentary outside JSON.\nSchema requirement:\n${schemaDescription}`;
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('LLM call timed out after 3500ms')), 3500)
      );

      const apiPromise = model.generateContent(fullPrompt);
      const response = await Promise.race([apiPromise, timeoutPromise]);
      const text = response.response.text() || '';
      return cleanJsonOutput(text);
    } catch (err) {
      console.warn(`[AI Engine] Gemini API returned error: ${err.message}. Falling back to deterministic local engine.`);
    }
  }

  // 3. Instant deterministic local engine fallback (0ms latency!)
  if (fallbackGenerator) {
    return fallbackGenerator();
  }

  throw new Error('LLM call failed and no fallback generator was provided.');
}
