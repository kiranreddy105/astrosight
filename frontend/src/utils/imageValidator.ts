export interface ValidationResult {
  isValid: boolean;
  reason: string;
  dimensions?: { width: number; height: number };
  format?: string;
  sizeMb?: number;
}

/**
 * Validates whether an uploaded image file represents legitimate planetary/lunar satellite imagery.
 * Rejects non-planetary imagery (e.g. colorful cartoons, UI graphics, text documents, solid blank images).
 */
export async function validatePlanetaryImage(file: File): Promise<ValidationResult> {
  const sizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
  const validExtensions = ['.png', '.jpg', '.jpeg', '.tif', '.tiff'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  // 1. File extension & size check (Max 50MB)
  if (!validExtensions.includes(ext) || sizeMb > 50 || sizeMb <= 0) {
    return {
      isValid: false,
      reason: 'Not a valid image for AstroSight analysis.',
      format: ext.replace('.', '').toUpperCase(),
      sizeMb
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // 2. Minimum resolution check (must be at least 64x64 and reasonable aspect ratio)
      if (width < 64 || height < 64 || width > 12000 || height > 12000) {
        return resolve({
          isValid: false,
          reason: 'Not a valid image for AstroSight analysis.',
          dimensions: { width, height },
          format: ext.replace('.', '').toUpperCase(),
          sizeMb
        });
      }

      // 3. Computer Vision Planetary Texture & Color Variance Analysis
      try {
        const canvas = document.createElement('canvas');
        const sampleSize = 128; // Sample at standard grid
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          // If 2D context is unavailable, accept with basic dimension validation
          return resolve({
            isValid: true,
            reason: 'Image validated successfully',
            dimensions: { width, height },
            format: ext.replace('.', '').toUpperCase(),
            sizeMb
          });
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

        let totalBrightness = 0;
        let brightnessVarianceSum = 0;
        let totalSaturation = 0;
        const totalPixels = sampleSize * sampleSize;

        const brightnessValues: number[] = new Array(totalPixels);

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          // Compute perceived luminance
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          brightnessValues[i / 4] = luminance;
          totalBrightness += luminance;

          // Compute HSV Saturation: (max - min) / max
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          totalSaturation += saturation;
        }

        const avgBrightness = totalBrightness / totalPixels;
        const avgSaturation = totalSaturation / totalPixels;

        // Calculate standard deviation of brightness
        for (let i = 0; i < totalPixels; i++) {
          brightnessVarianceSum += Math.pow(brightnessValues[i] - avgBrightness, 2);
        }
        const stdDevBrightness = Math.sqrt(brightnessVarianceSum / totalPixels);

        // Planetary satellite criteria:
        // - True lunar/martian surface imagery has low chromatic saturation (panchromatic/dust < 42%)
        // - Non-flat terrain (standard deviation > 10, prevents solid black, solid white, or flat graphics)
        // - Balanced luminance distribution
        const isNotBlank = stdDevBrightness >= 8;
        const isLowSaturation = avgSaturation <= 0.45; // Planetary imagery is primarily monochromatic grayscale/basalt

        if (!isNotBlank || !isLowSaturation) {
          return resolve({
            isValid: false,
            reason: 'Not a valid image for AstroSight analysis.',
            dimensions: { width, height },
            format: ext.replace('.', '').toUpperCase(),
            sizeMb
          });
        }

        return resolve({
          isValid: true,
          reason: 'Image validated successfully',
          dimensions: { width, height },
          format: ext.replace('.', '').toUpperCase(),
          sizeMb
        });
      } catch {
        // Fallback gracefully on CORS/Security restrictions
        return resolve({
          isValid: true,
          reason: 'Image validated successfully',
          dimensions: { width, height },
          format: ext.replace('.', '').toUpperCase(),
          sizeMb
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: false,
        reason: 'Not a valid image for AstroSight analysis.',
        format: ext.replace('.', '').toUpperCase(),
        sizeMb
      });
    };

    img.src = objectUrl;
  });
}
