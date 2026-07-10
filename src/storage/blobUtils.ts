/** Portable Blob → ArrayBuffer for happy-dom / Node / browsers. */
export async function toArrayBuffer(data: Blob | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) return data;
  if (data instanceof Uint8Array) {
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    ) as ArrayBuffer;
  }
  const blob = data as Blob;
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  // happy-dom / incomplete Blob polyfills
  if (typeof Response !== 'undefined') {
    return new Response(blob).arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

export async function toUint8Array(
  data: Blob | ArrayBuffer | Uint8Array
): Promise<Uint8Array> {
  const buf = await toArrayBuffer(data);
  return new Uint8Array(buf);
}
