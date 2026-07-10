export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-5 animate-pulse">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="h-5 w-16 rounded-full bg-gray-200" />
          <div className="flex gap-1">
            <div className="h-7 w-7 rounded bg-gray-100" />
            <div className="h-7 w-7 rounded bg-gray-100" />
          </div>
        </div>
        {/* Title */}
        <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-5/6 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
