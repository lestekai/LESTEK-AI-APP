/**
 * Intelligent in-browser background removal for product photos.
 * Performs perimeter flood-fill analysis and edge feathering to isolate
 * the product with a clean transparent background.
 */

export interface BackgroundRemovalOptions {
  tolerance?: number; // Color distance threshold (15 - 65, default ~32)
  cropToFit?: boolean; // Tightly crop bounding box to the product (default true)
  maxDimension?: number; // Optimal size for GPU compatibility & compact GLB (default 800)
}

export interface CutoutResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  aspectRatio: number;
  hasTransparency: boolean;
}

/**
 * Safely loads an image from File, Blob, Data URI or remote URL.
 * Bypasses CORS tainting by preferring Blob URLs and fetch when needed.
 */
export async function loadSafeImage(source: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    let objectUrl = '';
    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = '';
      }
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };

    img.onerror = async (err) => {
      cleanup();

      // If remote URL failed with CORS, try fetching as blob
      if (typeof source === 'string' && source.startsWith('http')) {
        try {
          const res = await fetch(source, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            objectUrl = URL.createObjectURL(blob);
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              cleanup();
              resolve(fallbackImg);
            };
            fallbackImg.onerror = () => reject(new Error('Falha ao carregar imagem remota.'));
            fallbackImg.src = objectUrl;
            return;
          }
        } catch {
          // Continue to reject below
        }
      }

      reject(new Error('Não foi possível carregar a imagem informada: ' + err));
    };

    if (typeof source !== 'string') {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else if (source.startsWith('data:') || source.startsWith('blob:')) {
      // Data and Blob URLs should never have crossOrigin set
      img.src = source;
    } else {
      // Remote HTTP(S) URL
      img.crossOrigin = 'anonymous';
      img.src = source;
    }
  });
}

/**
 * Isolates the product from its background directly in the browser canvas.
 */
export async function removeProductBackground(
  source: HTMLImageElement | string | File | Blob,
  options: BackgroundRemovalOptions = {}
): Promise<CutoutResult> {
  const { tolerance = 32, cropToFit = true, maxDimension = 800 } = options;

  let img: HTMLImageElement;
  if (source instanceof HTMLImageElement) {
    img = source;
  } else {
    img = await loadSafeImage(source);
  }

  const naturalWidth = img.naturalWidth || img.width || 800;
  const naturalHeight = img.naturalHeight || img.height || 800;

  // Compute scaled dimensions to preserve detail while keeping memory & GLB size tiny (~200KB)
  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;
  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // Draw initial image to canvas
  const workCanvas = document.createElement('canvas');
  workCanvas.width = targetWidth;
  workCanvas.height = targetHeight;
  const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Falha ao inicializar contexto 2D para processamento de imagem.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;
  const totalPixels = targetWidth * targetHeight;

  // Step 1: Detect if image is already a transparent cutout (>2% pixels with alpha < 20)
  let transparentPixelsCount = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 20) {
      transparentPixelsCount++;
    }
  }

  const isAlreadyTransparent = transparentPixelsCount / totalPixels > 0.02;

  if (!isAlreadyTransparent) {
    // Step 2: Sample perimeter pixels to establish the background reference color
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let sampleCount = 0;

    const sample = (x: number, y: number) => {
      const idx = (y * targetWidth + x) * 4;
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
      sampleCount++;
    };

    // Sample top and bottom rows
    for (let x = 0; x < targetWidth; x += 4) {
      sample(x, 0);
      sample(x, targetHeight - 1);
    }
    // Sample left and right columns
    for (let y = 0; y < targetHeight; y += 4) {
      sample(0, y);
      sample(targetWidth - 1, y);
    }

    const bgR = Math.round(sumR / Math.max(1, sampleCount));
    const bgG = Math.round(sumG / Math.max(1, sampleCount));
    const bgB = Math.round(sumB / Math.max(1, sampleCount));

    // Step 3: Edge-Connected Flood Fill (BFS from all 4 borders)
    // Ensures interior parts of the product (white logos, buttons, highlights) are NOT removed!
    const visited = new Uint8Array(totalPixels);
    const queueX = new Int32Array(totalPixels);
    const queueY = new Int32Array(totalPixels);
    let head = 0;
    let tail = 0;

    const pushQueue = (x: number, y: number) => {
      const idx = y * targetWidth + x;
      if (!visited[idx]) {
        visited[idx] = 1;
        queueX[tail] = x;
        queueY[tail] = y;
        tail++;
      }
    };

    // Initialize queue with all 4 outer borders
    for (let x = 0; x < targetWidth; x++) {
      pushQueue(x, 0);
      pushQueue(x, targetHeight - 1);
    }
    for (let y = 0; y < targetHeight; y++) {
      pushQueue(0, y);
      pushQueue(targetWidth - 1, y);
    }

    const featherZone = 18;

    while (head < tail) {
      const x = queueX[head];
      const y = queueY[head];
      head++;

      const pIdx = (y * targetWidth + x) * 4;
      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];

      // Perceptual color distance
      const dr = r - bgR;
      const dg = g - bgG;
      const db = b - bgB;
      const dist = Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);

      if (dist <= tolerance) {
        // Definite background pixel -> complete transparency
        data[pIdx + 3] = 0;

        // Push 4-connected neighbors
        if (x > 0) pushQueue(x - 1, y);
        if (x < targetWidth - 1) pushQueue(x + 1, y);
        if (y > 0) pushQueue(x, y - 1);
        if (y < targetHeight - 1) pushQueue(x, y + 1);
      } else if (dist < tolerance + featherZone) {
        // Edge feathering / antialiasing zone
        const factor = (dist - tolerance) / featherZone;
        data[pIdx + 3] = Math.round(255 * Math.min(Math.max(factor, 0), 1));
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // Step 4: Crop tightly to product bounding box if requested
  let finalCanvas = workCanvas;
  let finalWidth = targetWidth;
  let finalHeight = targetHeight;

  if (cropToFit) {
    let minX = targetWidth;
    let maxX = 0;
    let minY = targetHeight;
    let maxY = 0;
    let found = false;

    const freshData = ctx.getImageData(0, 0, targetWidth, targetHeight).data;
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const a = freshData[(y * targetWidth + x) * 4 + 3];
        if (a > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (found && maxX > minX && maxY > minY) {
      // Add slight 6px margin
      const pad = 6;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(targetWidth - 1, maxX + pad);
      maxY = Math.min(targetHeight - 1, maxY + pad);

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext('2d');
      if (cropCtx) {
        cropCtx.imageSmoothingEnabled = true;
        cropCtx.drawImage(workCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
        finalCanvas = cropCanvas;
        finalWidth = cropW;
        finalHeight = cropH;
      }
    }
  }

  // Generate PNG Data URL and Blob
  const dataUrl = finalCanvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((res) => {
    finalCanvas.toBlob((b) => res(b || new Blob()), 'image/png');
  });

  return {
    canvas: finalCanvas,
    dataUrl,
    blob,
    width: finalWidth,
    height: finalHeight,
    aspectRatio: finalHeight / Math.max(1, finalWidth),
    hasTransparency: true,
  };
}
