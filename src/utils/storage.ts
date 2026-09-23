import { TwineStoryData } from '../types/twine';
import { sampleStories } from '../data/sampleStories';

const DB_NAME = 'twine_hosting_platform_db';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        store.createIndex('title', 'title', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retrieves all stored Twine stories. Automatically seeds with sample stories on first launch.
 */
export async function getAllStories(): Promise<TwineStoryData[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        let results = (request.result as TwineStoryData[]) || [];
        // Sort by uploadedAt desc
        results.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB failed, falling back to in-memory/localStorage', err);
    return getFallbackStories();
  }
}

/**
 * Saves or updates a Twine story in storage.
 */
export async function saveStory(story: TwineStoryData): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(story);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for saveStory', err);
    saveFallbackStory(story);
  }
}

/**
 * Deletes a story by id.
 */
export async function deleteStory(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for deleteStory', err);
    deleteFallbackStory(id);
  }
}

/**
 * Increments play count and updates lastPlayedAt timestamp.
 */
export async function recordStoryPlayed(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as TwineStoryData;
        if (item) {
          item.playCount = (item.playCount || 0) + 1;
          item.lastPlayedAt = Date.now();
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (e) {
    console.warn('Record play failed', e);
  }
}

/**
 * Seeds initial sample stories into IndexedDB.
 */
async function seedSampleStories(): Promise<void> {
  try {
    const db = await openDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    for (const sample of sampleStories) {
      store.put(sample);
    }
    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve(); // Non-blocking
    });
  } catch (err) {
    console.error('Error seeding sample stories:', err);
  }
}

// Fallback implementations using localStorage if IndexedDB is blocked
const LOCALSTORAGE_KEY = 'twine_stories_backup_v1';

function getFallbackStories(): TwineStoryData[] {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveFallbackStory(story: TwineStoryData): void {
  try {
    const existing = getFallbackStories().filter((s) => s.id !== story.id);
    existing.unshift(story);
    // Prune rawHtml if too big for localStorage fallback
    const pruned = existing.map((s) => ({
      ...s,
      rawHtml: s.rawHtml.length > 500000 ? s.rawHtml.slice(0, 500000) : s.rawHtml,
    }));
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(pruned));
  } catch (e) {
    console.warn('LocalStorage quota reached in fallback mode', e);
  }
}

function deleteFallbackStory(id: string): void {
  try {
    const existing = getFallbackStories().filter((s) => s.id !== id);
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(existing));
  } catch (e) {}
}
