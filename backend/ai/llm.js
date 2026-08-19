import dotenv from 'dotenv';
dotenv.config();

/**
 * Robust JSON extraction helper from LLM output
 */
export function cleanJsonOutput(rawText) {
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
 * Fast, non-blocking LLM caller with 1.5s AbortController timeout
 */
export async function callLLM({ prompt, schemaDescription, fallbackGenerator }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // Attempt Gemini API call if key is provided
  if (apiKey && apiKey.length > 10 && !apiKey.includes('YOUR_')) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const fullPrompt = `${prompt}\n\nIMPORTANT INSTRUCTION: Respond strictly with valid JSON. Do not include markdown headers or commentary outside JSON.\nSchema requirement:\n${schemaDescription}`;
      
      // 3.0s timeout promise race
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('LLM call timed out after 3000ms')), 3000)
      );

      const apiPromise = model.generateContent(fullPrompt);
      const response = await Promise.race([apiPromise, timeoutPromise]);
      const text = response.response.text() || '';
      return cleanJsonOutput(text);
    } catch (err) {
      console.warn(`[AI Engine] Gemini API returned error: ${err.message}. Falling back to deterministic local engine.`);
    }
  }

  // Instant deterministic local engine fallback (0ms latency!)
  if (fallbackGenerator) {
    return fallbackGenerator();
  }

  throw new Error('LLM call failed and no fallback generator was provided.');
}
