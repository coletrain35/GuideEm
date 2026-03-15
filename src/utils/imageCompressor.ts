/**
 * Intercepts an image file, draws it to an invisible canvas,
 * and compresses it to a WebP Base64 string at 70% quality.
 *
 * @param file - The raw image file (e.g., from a drag-and-drop event).
 * @returns A Promise that resolves to the compressed WebP Base64 string.
 */
export const compressImageToWebP = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Ensure the file is an image
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }

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

        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;

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
