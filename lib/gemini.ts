import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!model) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
  }
  return model;
}

export interface SeriesInfo {
  synopsis: string;
  rating: string;
  seasons: string;
  genre: string;
  where_to_watch: string;
}

export async function getSeriesInfo(seriesName: string): Promise<SeriesInfo> {
  const geminiModel = getModel();

  const prompt = `You are a TV/movie expert. Provide information about "${seriesName}":
1. A brief synopsis (2-3 sentences)
2. Rating (e.g., "8.5/10 IMDb" or "92% Rotten Tomatoes")
3. Number of seasons (or "Movie" if it's a film)
4. Genre(s)
5. Where to watch (common streaming platforms like Netflix, HBO Max, Amazon Prime, Hulu, Disney+, etc.)

Return as JSON with these exact keys: synopsis, rating, seasons, genre, where_to_watch
If you cannot find information, use "Unknown" for that field.`;

  const result = await geminiModel.generateContent(prompt);

  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      synopsis: 'Unable to fetch synopsis',
      rating: 'Unknown',
      seasons: 'Unknown',
      genre: 'Unknown',
      where_to_watch: 'Unknown',
    };
  }
}
