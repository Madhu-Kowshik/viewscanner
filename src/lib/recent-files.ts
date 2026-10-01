import { RecentFileMeta } from '../types/pdf';

const RECENT_FILES_KEY = 'omnipdf_recent_files_meta';
const MAX_RECENT_FILES = 15;

export function getRecentFiles(): RecentFileMeta[] {
  try {
    const raw = localStorage.getItem(RECENT_FILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentFile(meta: Omit<RecentFileMeta, 'id' | 'timestamp'>): void {
  try {
    const current = getRecentFiles();
    const newEntry: RecentFileMeta = {
      ...meta,
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      timestamp: Date.now(),
    };

    // Filter out duplicate names
    const filtered = current.filter((item) => item.name !== meta.name);
    const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_FILES);

    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
  } catch {
    // Graceful fallback for storage limits
  }
}

export function removeRecentFile(id: string): void {
  try {
    const current = getRecentFiles();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function clearRecentFiles(): void {
  try {
    localStorage.removeItem(RECENT_FILES_KEY);
  } catch {
    // Ignore
  }
}
