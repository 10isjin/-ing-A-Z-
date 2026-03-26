import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';

let detector: faceDetection.FaceDetector | null = null;

export async function initDetector() {
  if (detector) return detector;
  
  try {
    await tf.ready();
    // Explicitly set backend to webgl for better performance/compatibility in browser
    if (tf.getBackend() !== 'webgl') {
      try {
        await tf.setBackend('webgl');
      } catch (e) {
        console.warn("WebGL backend failed, falling back to CPU", e);
        await tf.setBackend('cpu');
      }
    }
  } catch (e) {
    console.error("TFJS initialization failed:", e);
  }

  const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
  const detectorConfig: faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
    runtime: 'tfjs',
    maxFaces: 50,
    modelType: 'full',
  };
  
  detector = await faceDetection.createDetector(model, detectorConfig);
  return detector;
}

export async function blurFaces(imageElement: HTMLImageElement): Promise<{ canvas: HTMLCanvasElement; facesCount: number }> {
  const det = await initDetector();
  
  // Use natural dimensions for accuracy
  const width = imageElement.naturalWidth || imageElement.width;
  const height = imageElement.naturalHeight || imageElement.height;
  
  console.log(`Detecting faces in ${width}x${height} image...`);
  const faces = await det.estimateFaces(imageElement);
  console.log(`Detected ${faces.length} faces`);
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw original image
  ctx.drawImage(imageElement, 0, 0, width, height);
  
  // Blur each face
  for (const face of faces) {
    const { xMin, yMin, width: fWidth, height: fHeight } = face.box;
    
    // Add 40% padding to the face box to ensure full coverage
    const padding = 0.4;
    const x = Math.floor(Math.max(0, xMin - fWidth * padding));
    const y = Math.floor(Math.max(0, yMin - fHeight * padding));
    const w = Math.floor(Math.min(width - x, fWidth * (1 + padding * 2)));
    const h = Math.floor(Math.min(height - y, fHeight * (1 + padding * 2)));
    
    console.log(`Blurring face at [${x}, ${y}, ${w}, ${h}]`);

    // 1. Apply Mosaic (Very robust method)
    ctx.save();
    
    // Create a path for the face (ellipse is better for faces)
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.clip();
    
    // Mosaic: draw 1x1 pixels scaled up to block size
    // We use a fixed block size relative to face size to ensure it's always visible
    const blockSize = Math.max(8, Math.floor(w / 8)); 
    
    // Disable smoothing for mosaic effect
    ctx.imageSmoothingEnabled = false;
    
    // Manual mosaic to ensure it works even if filters fail
    for (let py = 0; py < h; py += blockSize) {
      for (let px = 0; px < w; px += blockSize) {
        // Get the color of the center pixel of this block
        const sourceX = Math.floor(x + px + blockSize / 2);
        const sourceY = Math.floor(y + py + blockSize / 2);
        
        // Draw a 1x1 area from original image to a blockSize x blockSize area on canvas
        ctx.drawImage(imageElement, sourceX, sourceY, 1, 1, x + px, y + py, blockSize, blockSize);
      }
    }
    
    // 2. Add a semi-transparent dark overlay to make it even more obscured
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    
    ctx.restore();
  }
  
  return { canvas, facesCount: faces.length };
}

export async function processFile(file: File): Promise<{ file: File; facesCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Handle potential CORS issues
      img.onload = async () => {
        try {
          const { canvas, facesCount } = await blurFaces(img);
          canvas.toBlob((blob) => {
            if (blob) {
              const blurredFile = new File([blob], file.name, { type: 'image/jpeg' }); // Force jpeg for consistency
              resolve({ file: blurredFile, facesCount });
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          }, 'image/jpeg', 0.85); // Quality 0.85
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}
