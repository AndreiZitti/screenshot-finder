import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

async function transcribeWithGroq(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const groq = getGroqClient();
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

async function transcribeWithGemini(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
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

export async function transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const groq = getGroqClient();

  if (groq) {
    try {
      console.log('Using Groq Whisper for transcription');
      return await transcribeWithGroq(audioBuffer, mimeType);
    } catch (error) {
      console.error('Groq transcription failed, falling back to Gemini:', error);
    }
  }

  console.log('Using Gemini for transcription');
  return await transcribeWithGemini(audioBuffer, mimeType);
}
