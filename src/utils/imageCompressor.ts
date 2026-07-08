/**
 * Intercepts an image file, draws it to an invisible canvas,
 * and compresses it to a WebP Base64 string at 70% quality.
 *
 * SVG files are supported: they're sanitized (scripts / event handlers /
 * foreignObject stripped) and rasterized to canvas before being re-encoded.
 * This is the common case for logos and icons in technical documentation.
 *
 * @param file - The raw image file (e.g., from a drag-and-drop event).
 * @returns A Promise that resolves to the compressed WebP Base64 string.
 */

/**
 * Maximum dimension (width or height) for the rasterized output.  Keeps the
 * resulting base64 payload small and prevents OOM on giant source images.
 */
const MAX_DIMENSION = 2400;

/**
 * Hard upper bound on accepted image size, in bytes.  Anything larger is
 * rejected synchronously so the main thread never has to decode an oversized
 * bitmap.  20 MB comfortably accommodates an uncompressed phone screenshot.
 */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const sanitizeSvgText = (text: string): string => {
  if (typeof DOMParser === 'undefined') {
    throw new Error('SVG sanitization is not supported in this environment.');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('SVG file is not valid XML.');
  }
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') {
    throw new Error('SVG file has no <svg> root element.');
  }
  // Strip script-style elements entirely.
  doc.querySelectorAll('script, foreignObject').forEach((el) => el.remove());
  // Strip inline event handlers (on*) and javascript: hrefs/xlinks.
  const all = doc.querySelectorAll('*');
  all.forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) el.removeAttribute(attr.name);
      if ((name === 'href' || name === 'xlink:href') && value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  const serializer = new XMLSerializer();
  return serializer.serializeToString(root);
};

const rasterizeSvg = (file: File): Promise<string> =>
  file.text().then(
    (text) =>
      new Promise<string>((resolve, reject) => {
        let sanitized: string;
        try {
          sanitized = sanitizeSvgText(text);
        } catch (err: any) {
          reject(new Error(err?.message || 'Could not sanitize SVG.'));
          return;
        }
        const blob = new Blob([sanitized], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          try {
            const w = Math.min(img.naturalWidth || MAX_DIMENSION, MAX_DIMENSION);
            const h = Math.min(img.naturalHeight || MAX_DIMENSION, MAX_DIMENSION);
            const canvas = document.createElement('canvas');
            canvas.width = w > 0 ? w : MAX_DIMENSION;
            canvas.height = h > 0 ? h : MAX_DIMENSION;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error('Failed to get canvas context for SVG.'));
              return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/webp', 0.7));
          } catch (err: any) {
            reject(new Error(err?.message || 'Failed to rasterize SVG.'));
          } finally {
            URL.revokeObjectURL(url);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Could not render SVG. Try exporting it as PNG first.'));
        };
        img.src = url;
      })
  );

export const compressImageToWebP = (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('File is not an image.'));
  }

  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    const maxMb = (MAX_IMAGE_BYTES / 1024 / 1024).toFixed(0);
    return Promise.reject(
      new Error(`Image is ${mb} MB — maximum is ${maxMb} MB. Resize it before uploading.`)
    );
  }

  if (file.type === 'image/svg+xml') {
    return rasterizeSvg(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create an invisible canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }

        // Cap the rasterized dimensions so a 12,000px source doesn't OOM
        // the tab.  Width/height ratio is preserved.
        let w = img.width || MAX_DIMENSION;
        let h = img.height || MAX_DIMENSION;
        if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
          const scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w;
        canvas.height = h;

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Export as WebP Base64 string at 70% quality
        const webpBase64 = canvas.toDataURL('image/webp', 0.7);
        resolve(webpBase64);
      };

      img.onerror = (error) => {
        reject(new Error('Failed to load image for compression'));
      };

      // Set the image source to the FileReader result
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        reject(new Error('Failed to read file as Data URL'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Read the file as a Data URL to load it into the Image object
    reader.readAsDataURL(file);
  });
};
