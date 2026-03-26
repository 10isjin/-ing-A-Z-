import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection';

let detector: faceDetection.FaceDetector | null = null;

export async function initDetector() {
  if (detector) return detector;
  
  const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
  const detectorConfig: faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
    runtime: 'tfjs',
    maxFaces: 20,
    modelType: 'short', // 'short' for closer faces, 'full' for farther
  };
  
  detector = await faceDetection.createDetector(model, detectorConfig);
  return detector;
}

export async function blurFaces(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const det = await initDetector();
  const faces = await det.estimateFaces(imageElement);
  
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw original image
  ctx.drawImage(imageElement, 0, 0);
  
  // Blur each face
  for (const face of faces) {
    const { xMin, yMin, width, height } = face.box;
    
    // Add 20% padding to the face box to ensure full coverage
    const padding = 0.2;
    const x = Math.max(0, xMin - width * padding);
    const y = Math.max(0, yMin - height * padding);
    const w = Math.min(imageElement.width - x, width * (1 + padding * 2));
    const h = Math.min(imageElement.height - y, height * (1 + padding * 2));
    
    // Create a temporary canvas for the face
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = w;
    faceCanvas.height = h;
    const faceCtx = faceCanvas.getContext('2d');
    
    if (faceCtx) {
      // Draw the face area
      faceCtx.drawImage(imageElement, x, y, w, h, 0, 0, w, h);
      
      // Apply blur
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      
      // Simple blur by drawing scaled down and back up
      const blurScale = 0.05; // More pixelated
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = Math.max(1, w * blurScale);
      smallCanvas.height = Math.max(1, h * blurScale);
      const smallCtx = smallCanvas.getContext('2d');
      if (smallCtx) {
        smallCtx.drawImage(faceCanvas, 0, 0, w, h, 0, 0, smallCanvas.width, smallCanvas.height);
        ctx.filter = 'blur(25px)'; // Stronger blur
        ctx.drawImage(smallCanvas, 0, 0, smallCanvas.width, smallCanvas.height, x, y, w, h);
      }
      
      ctx.restore();
    }
  }
  
  return canvas;
}

export async function processFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const blurredCanvas = await blurFaces(img);
          blurredCanvas.toBlob((blob) => {
            if (blob) {
              const blurredFile = new File([blob], file.name, { type: file.type });
              resolve(blurredFile);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          }, file.type);
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
