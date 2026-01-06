import { supabase } from '@/lib/supabase';
import { Series } from '@/types/series';
import SeriesCard from '@/components/SeriesCard';

export const revalidate = 0;

async function getSeries(): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching series:', error);
    return [];
  }

  return data || [];
}

export default async function Library() {
  const series = await getSeries();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Library</h1>
        <p className="mt-2 text-gray-600">
          All the series you&apos;ve identified
        </p>
      </div>

      {series.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No series found yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Upload some screenshots to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((item) => (
            <SeriesCard key={item.id} series={item} />
          ))}
        </div>
      )}
    </div>
  );
}
