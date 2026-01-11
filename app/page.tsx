import CaptureZone from '@/components/CaptureZone';

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Capture
        </h1>
        <p className="mt-2 text-gray-600">
          Drop a screenshot or record a voice note
        </p>
      </div>
      <CaptureZone />
    </div>
  );
}
