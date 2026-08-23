export interface PreparedImage {
  base64: string;
  mimeType: string;
}

/** Downscales and JPEG-compresses a photo before sending it over the network to Gemini. */
export async function prepareImage(file: File, maxDim = 1600, quality = 0.85): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image compression failed'))), 'image/jpeg', quality);
  });

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(blob);
  });

  return { base64, mimeType: 'image/jpeg' };
}
