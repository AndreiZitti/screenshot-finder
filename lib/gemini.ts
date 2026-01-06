import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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

export interface SeriesInfo {
  synopsis: string;
  rating: string;
  seasons: string;
  genre: string;
  where_to_watch: string;
}

export async function getSeriesInfo(seriesName: string): Promise<SeriesInfo> {
  const model = getSearchModel();

  const prompt = `Search the web for "${seriesName}" (could be a TV series, movie, anime, or web series).

Look up information about this title and provide:
1. Synopsis: A brief 2-3 sentence description of the plot
2. Rating: The rating from IMDb, MyAnimeList, Rotten Tomatoes, or similar (e.g., "8.5/10 IMDb")
3. Seasons: Number of seasons, or "Movie" if it's a film, or "OVA/Special" for anime specials
4. Genre: The genre(s)
5. Where to watch: Streaming platforms where it's available (Netflix, Crunchyroll, Amazon Prime, etc.)

IMPORTANT: You MUST search the web to find this information. Do not rely on your training data.

Respond with ONLY a JSON object in this exact format, no other text:
{"synopsis": "...", "rating": "...", "seasons": "...", "genre": "...", "where_to_watch": "..."}

If you truly cannot find any information after searching, use "Unknown" for that field.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
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
