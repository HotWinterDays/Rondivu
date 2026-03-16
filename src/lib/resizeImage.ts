/**
 * Resizes an image client-side to fit within maxBytes using Canvas.
 * Returns a JPEG Blob. Used to keep banner uploads under 1MB.
 */
export function resizeImage(
  file: File,
  maxBytes: number,
  maxWidth = 1920
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxWidth / width);
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      const tryQuality = (quality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("toBlob failed"));
              return;
            }
            if (blob.size <= maxBytes || quality <= 0.1) {
              resolve(blob);
            } else {
              tryQuality(Math.max(0.1, quality - 0.15));
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryQuality(0.9);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
