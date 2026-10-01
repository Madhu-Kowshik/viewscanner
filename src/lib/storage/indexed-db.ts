// IndexedDB storage utility for OmniPDF session recovery and autosave
// Ensures large PDF ArrayBuffers are stored safely without localStorage quota limitations.

const DB_NAME = 'omnipdf_workspace_db';
const DB_VERSION = 1;
const STORE_NAME = 'active_session';

interface SavedSession {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  data: ArrayBuffer;
  timestamp: number;
  operationName?: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSessionDocument(
  name: string,
  size: number,
  pageCount: number,
  data: ArrayBuffer,
  operationName = 'Last Saved'
): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const session: SavedSession = {
      id: 'current_active_doc',
      name,
      size,
      pageCount,
      data,
      timestamp: Date.now(),
      operationName,
    };

    store.put(session);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed saving session to IndexedDB:', err);
  }
}

export async function getSavedSessionDocument(): Promise<SavedSession | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('current_active_doc');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result as SavedSession | undefined;
        // Expire session if older than 48 hours
        if (result && Date.now() - result.timestamp < 48 * 60 * 60 * 1000) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed retrieving session from IndexedDB:', err);
    return null;
  }
}

export async function clearSavedSessionDocument(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('current_active_doc');
  } catch (err) {
    console.warn('Failed clearing session from IndexedDB:', err);
  }
}
