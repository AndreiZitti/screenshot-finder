import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

let groqClient: Groq | null = null;
let cachedGroqKey: string | null = null;

function getGroqClient(apiKey?: string): Groq | null {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    return null;
  }

  // If a user-provided key, create a fresh client (don't cache)
  if (apiKey) {
    return new Groq({ apiKey });
  }

  // Default: use cached singleton with env var
  if (!groqClient || cachedGroqKey !== key) {
    groqClient = new Groq({ apiKey: key });
    cachedGroqKey = key;
  }
  return groqClient;
}

async function transcribeWithGroq(audioBuffer: Buffer, mimeType: string, apiKey?: string): Promise<string> {
  const groq = getGroqClient(apiKey);
  if (!groq) {
    throw new Error('Groq client not available');
  }

  // Create a File-like object for Groq
  const uint8Array = new Uint8Array(audioBuffer);
  const file = new File([uint8Array], 'audio.webm', { type: mimeType });

  const response = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'en',
  });

  return response.text;
}

async function transcribeWithGemini(audioBuffer: Buffer, mimeType: string, geminiApiKey?: string): Promise<string> {
  const key = geminiApiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Gemini API key not available');
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const base64Audio = audioBuffer.toString('base64');

  const result = await model.generateContent([
    { text: 'Transcribe this audio. Return only the transcribed text, nothing else.' },
    {
      inlineData: {
        mimeType,
        data: base64Audio,
      },
    },
  ]);

  return result.response.text().trim();
}

export async function transcribe(
  audioBuffer: Buffer,
  mimeType: string,
  options?: { groqApiKey?: string; geminiApiKey?: string }
): Promise<string> {
  const groq = getGroqClient(options?.groqApiKey);

  if (groq) {
    try {
      console.log('Using Groq Whisper for transcription');
      return await transcribeWithGroq(audioBuffer, mimeType, options?.groqApiKey);
    } catch (error) {
      console.error('Groq transcription failed, falling back to Gemini:', error);
    }
  }

  console.log('Using Gemini for transcription');
  return await transcribeWithGemini(audioBuffer, mimeType, options?.geminiApiKey);
}
