import Groq from 'groq-sdk';
import { DiscoveryType } from '@/types/discovery';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

const TYPE_PROMPTS: Record<DiscoveryType, string> = {
  series: 'Identify the TV show, movie, or anime title shown',
  api_library: 'Identify any programming library, API, SDK, or framework mentioned',
  ai_tip: 'Identify the AI technique, prompt pattern, tool, or workflow shown',
  gadget: 'Identify the tech product, device, or hardware shown',
  other: 'Identify the main subject, product, or concept shown',
};

export async function extractName(imageBase64: string, type: DiscoveryType): Promise<string> {
  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are analyzing a screenshot. ${TYPE_PROMPTS[type]}.

Return ONLY the exact name, nothing else. If you cannot identify it, return "Unknown".`,
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
