import { Series } from '@/types/series';

interface SeriesCardProps {
  series: Series;
}

export default function SeriesCard({ series }: SeriesCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-5">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          {series.name}
        </h3>

        {series.synopsis && (
          <p className="mb-3 text-sm text-gray-600 line-clamp-3">
            {series.synopsis}
          </p>
        )}

        <div className="space-y-1.5 text-sm">
          {series.rating && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Rating:</span>
              <span className="text-gray-900">{series.rating}</span>
            </div>
          )}

          {series.seasons && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Seasons:</span>
              <span className="text-gray-900">{series.seasons}</span>
            </div>
          )}

          {series.genre && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Genre:</span>
              <span className="text-gray-900">{series.genre}</span>
            </div>
          )}

          {series.where_to_watch && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Watch on:</span>
              <span className="text-gray-900">{series.where_to_watch}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
