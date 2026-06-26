import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { DiscoveryType, DiscoveryInfo } from '@/types/discovery';

const TYPE_PROMPTS: Record<DiscoveryType, string> = {
  series: 'Identify the TV show, movie, or anime title shown',
  api_library: 'Identify any programming library, API, SDK, or framework mentioned',
  ai_tip: 'Identify the AI technique, prompt pattern, tool, or workflow shown',
  gadget: 'Identify the tech product, device, or hardware shown',
  note: 'Identify the main subject or topic mentioned',
  other: 'Identify the main subject, product, or concept shown',
};

let genAI: GoogleGenerativeAI | null = null;
let searchModel: GenerativeModel | null = null;

function getSearchModel(apiKey?: string): GenerativeModel {
  // If a user-provided key is given, always create a fresh instance (no caching)
  if (apiKey) {
    const userGenAI = new GoogleGenerativeAI(apiKey);
    return userGenAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [{ googleSearch: {} } as never],
    });
  }

  // Default: use cached singleton with env var
  if (!searchModel) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    searchModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [{ googleSearch: {} } as never],
    });
  }
  return searchModel;
}

const TYPE_SEARCH_PROMPTS: Record<DiscoveryType, string> = {
  series: `Find: synopsis, rating (IMDb/MAL/RT), number of seasons (or "Movie"/"OVA"), genre, streaming platforms.
Return metadata with keys: rating, seasons, genre, where_to_watch`,

  api_library: `Find: description, GitHub stars, programming language, documentation URL, install command (npm/pip/etc).
Return metadata with keys: stars, language, docs_url, install_command`,

  ai_tip: `Find: description of the technique/tool, original source or author, category (prompting/workflow/tool), related tools.
Return metadata with keys: source, category, related_tools`,

  gadget: `Find: description, price range, key specifications, where to buy.
Return metadata with keys: price, specs, where_to_buy`,

  note: `Find: description and any relevant context.
Return metadata with keys: source`,

  other: `Find: description and any relevant official link or source.
Return metadata with keys: source`,
};

const TYPE_LABELS: Record<DiscoveryType, string> = {
  series: 'TV series, movie, or anime',
  api_library: 'programming library, API, or SDK',
  ai_tip: 'AI technique, tool, or workflow',
  gadget: 'tech product or gadget',
  note: 'voice note',
  other: 'topic',
};

export async function getDiscoveryInfo(name: string, type: DiscoveryType, apiKey?: string): Promise<DiscoveryInfo> {
  const model = getSearchModel(apiKey);

  const prompt = `Search the web for "${name}" (${TYPE_LABELS[type]}).

${TYPE_SEARCH_PROMPTS[type]}

IMPORTANT: You MUST search the web to find this information. Do not rely on your training data.

Respond with ONLY a JSON object in this exact format, no other text:
{"description": "2-3 sentence description", "link": "official or most relevant URL", "metadata": {...}}

If you truly cannot find information after searching, use "Unknown" for that field.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch {
    return {
      description: 'Unable to fetch description',
      link: '',
      metadata: {},
    };
  }
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  type: DiscoveryType,
  hint?: string,
  apiKey?: string
): Promise<{ name: string } & DiscoveryInfo> {
  const model = getSearchModel(apiKey);

  const hintSection = hint
    ? `\n\nUSER HINT: The user provided this hint about the image: "${hint}". Use this to help identify and search for the subject.`
    : '';

  const prompt = `You are analyzing a screenshot. ${TYPE_PROMPTS[type]}${hintSection}

First, identify what this is. Then search the web to find detailed information about it.

${TYPE_SEARCH_PROMPTS[type]}

IMPORTANT: You MUST search the web to find accurate, up-to-date information.

Respond with ONLY a JSON object in this exact format, no other text:
{"name": "exact name identified", "description": "2-3 sentence description", "link": "official or most relevant URL", "metadata": {...}}

If you cannot identify the subject, respond with: {"name": "Unknown", "description": "", "link": "", "metadata": {}}`;

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch {
    return {
      name: 'Unknown',
      description: 'Unable to analyze image',
      link: '',
      metadata: {},
    };
  }
}
