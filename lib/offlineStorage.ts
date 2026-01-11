import { get, set, del, keys } from 'idb-keyval';

export interface PendingCapture {
  id: string;
  type: 'image' | 'voice';
  blob: Blob;
  selectedType?: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'failed';
}

const STORAGE_KEY_PREFIX = 'pending-capture-';

export async function savePendingCapture(capture: PendingCapture): Promise<void> {
  await set(`${STORAGE_KEY_PREFIX}${capture.id}`, capture);
}

export async function getPendingCapture(id: string): Promise<PendingCapture | undefined> {
  return get(`${STORAGE_KEY_PREFIX}${id}`);
}

export async function deletePendingCapture(id: string): Promise<void> {
  await del(`${STORAGE_KEY_PREFIX}${id}`);
}

export async function getAllPendingCaptures(): Promise<PendingCapture[]> {
  const allKeys = await keys();
  const pendingKeys = allKeys.filter(
    (key) => typeof key === 'string' && key.startsWith(STORAGE_KEY_PREFIX)
  );

  const captures: PendingCapture[] = [];
  for (const key of pendingKeys) {
    const capture = await get(key);
    if (capture) {
      captures.push(capture as PendingCapture);
    }
  }

  return captures.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateCaptureStatus(
  id: string,
  status: PendingCapture['status']
): Promise<void> {
  const capture = await getPendingCapture(id);
  if (capture) {
    capture.status = status;
    await savePendingCapture(capture);
  }
}

export async function getPendingCount(): Promise<number> {
  const allKeys = await keys();
  return allKeys.filter(
    (key) => typeof key === 'string' && key.startsWith(STORAGE_KEY_PREFIX)
  ).length;
}
