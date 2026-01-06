import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { DiscoveryType, DiscoveryInfo } from '@/types/discovery';

let genAI: GoogleGenerativeAI | null = null;
let searchModel: GenerativeModel | null = null;

function getSearchModel(): GenerativeModel {
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

  other: `Find: description and any relevant official link or source.
Return metadata with keys: source`,
};

const TYPE_LABELS: Record<DiscoveryType, string> = {
  series: 'TV series, movie, or anime',
  api_library: 'programming library, API, or SDK',
  ai_tip: 'AI technique, tool, or workflow',
  gadget: 'tech product or gadget',
  other: 'topic',
};

export async function getDiscoveryInfo(name: string, type: DiscoveryType): Promise<DiscoveryInfo> {
  const model = getSearchModel();

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
