import { toArrayBuffer } from './blobUtils';

/** SHA-256 hex of an ArrayBuffer (Web Crypto). */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Blob(blob: Blob): Promise<string> {
  const buf = await toArrayBuffer(blob);
  return sha256Hex(buf);
}
