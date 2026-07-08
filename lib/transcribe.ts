import { GoogleGenerativeAI } from '@google/generative-ai';

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
  options?: { geminiApiKey?: string }
): Promise<string> {
  return await transcribeWithGemini(audioBuffer, mimeType, options?.geminiApiKey);
}
