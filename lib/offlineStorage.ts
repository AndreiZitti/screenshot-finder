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

export async function savePendingCapture(capture: PendingCapture): Promise<boolean> {
  try {
    await set(`${STORAGE_KEY_PREFIX}${capture.id}`, capture);
    return true;
  } catch (error) {
    console.error('Failed to save capture to IndexedDB:', error);
    return false;
  }
}

export async function getPendingCapture(id: string): Promise<PendingCapture | undefined> {
  try {
    return await get(`${STORAGE_KEY_PREFIX}${id}`);
  } catch (error) {
    console.error('Failed to get capture from IndexedDB:', error);
    return undefined;
  }
}

export async function deletePendingCapture(id: string): Promise<boolean> {
  try {
    await del(`${STORAGE_KEY_PREFIX}${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete capture from IndexedDB:', error);
    return false;
  }
}

export async function getAllPendingCaptures(): Promise<PendingCapture[]> {
  try {
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
  } catch (error) {
    console.error('Failed to get all captures from IndexedDB:', error);
    return [];
  }
}

export async function updateCaptureStatus(
  id: string,
  status: PendingCapture['status']
): Promise<boolean> {
  try {
    const capture = await getPendingCapture(id);
    if (capture) {
      capture.status = status;
      return await savePendingCapture(capture);
    }
    return false;
  } catch (error) {
    console.error('Failed to update capture status in IndexedDB:', error);
    return false;
  }
}

export async function getPendingCount(): Promise<number> {
  try {
    const allKeys = await keys();
    return allKeys.filter(
      (key) => typeof key === 'string' && key.startsWith(STORAGE_KEY_PREFIX)
    ).length;
  } catch (error) {
    console.error('Failed to get pending count from IndexedDB:', error);
    return 0;
  }
}
