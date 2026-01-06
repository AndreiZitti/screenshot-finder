import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

export async function extractSeriesName(imageBase64: string): Promise<string> {
  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Look at this screenshot and identify the TV series or movie shown. Return ONLY the exact name of the series/movie, nothing else. If you cannot identify it, return "Unknown".',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content?.trim() || 'Unknown';
}
