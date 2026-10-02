import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function sanitizeFileName(name: string): string {
  // Strip dangerous path separators or invalid filename characters
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'document.pdf';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function getBaseFileName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

export async function downloadBlob(blob: Blob, fileName: string): Promise<void> {
  // Check if Web Share API is available with file sharing support (typically iOS Safari & modern mobile browsers)
  // This allows mobile users to save directly to iOS Files, AirDrop, Google Drive, or open in apps.
  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
    try {
      const file = new File([blob], fileName, { type: blob.type || 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
        });
        return;
      }
    } catch (err: unknown) {
      // AbortError indicates user dismissed share sheet; don't trigger unwanted fallback download
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      // Otherwise fall through to standard anchor download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Keep URL valid for 30s on mobile devices where browser download takes time to initialize
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
