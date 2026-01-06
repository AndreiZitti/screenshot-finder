import UploadZone from '@/components/UploadZone';

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Identify Any Series
        </h1>
        <p className="mt-2 text-gray-600">
          Upload a screenshot and we&apos;ll tell you what you&apos;re watching
        </p>
      </div>
      <UploadZone />
    </div>
  );
}
