import dotenv from 'dotenv';
dotenv.config();

/**
 * Robust JSON extraction helper from LLM output (removes markdown backticks if present)
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
    // Attempt fallback pattern match for { ... } or [ ... ]
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
 * Primary LLM caller supporting Gemini API or fallback rule engine
 */
export async function callLLM({ prompt, schemaDescription, fallbackGenerator }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const fullPrompt = `${prompt}\n\nIMPORTANT INSTRUCTION: Respond strictly with valid JSON. Do not include markdown headers or commentary outside JSON.\nSchema requirement:\n${schemaDescription}`;
      
      const response = await model.generateContent(fullPrompt);
      const text = response.response.text() || '';
      return cleanJsonOutput(text);
    } catch (err) {
      console.warn('⚠️ Gemini API call failed/timed out, switching to smart local intelligence engine:', err.message);
    }
  }

  // Smart deterministic local engine fallback when API key is unconfigured
  if (fallbackGenerator) {
    return fallbackGenerator();
  }

  throw new Error('LLM call failed and no fallback generator was provided.');
}
