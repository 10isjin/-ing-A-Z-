import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection';

let detector: faceDetection.FaceDetector | null = null;

export async function initDetector() {
  if (detector) return detector;
  
  await tf.ready();
  const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
  const detectorConfig: faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
    runtime: 'tfjs',
    maxFaces: 50,
    modelType: 'full',
  };
  
  detector = await faceDetection.createDetector(model, detectorConfig);
  return detector;
}

export async function blurFaces(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<{ canvas: HTMLCanvasElement; facesCount: number }> {
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
    
    // Add 35% padding to the face box to ensure full coverage (hair, chin, etc)
    const padding = 0.35;
    const x = Math.max(0, xMin - width * padding);
    const y = Math.max(0, yMin - height * padding);
    const w = Math.min(imageElement.width - x, width * (1 + padding * 2));
    const h = Math.min(imageElement.height - y, height * (1 + padding * 2));
    
    // 1. Create a temporary canvas for the face area
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = w;
    faceCanvas.height = h;
    const faceCtx = faceCanvas.getContext('2d');
    
    if (faceCtx) {
      faceCtx.drawImage(imageElement, x, y, w, h, 0, 0, w, h);
      
      // 2. Apply Mosaic + Blur
      ctx.save();
      
      // Create a path for the face (ellipse is better for faces)
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
      ctx.clip();
      
      // Mosaic: draw very small then scale up with smoothing disabled
      const mosaicScale = 0.03; // Even more pixelated
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = Math.max(1, w * mosaicScale);
      smallCanvas.height = Math.max(1, h * mosaicScale);
      const smallCtx = smallCanvas.getContext('2d');
      
      if (smallCtx) {
        smallCtx.imageSmoothingEnabled = false;
        smallCtx.drawImage(faceCanvas, 0, 0, w, h, 0, 0, smallCanvas.width, smallCanvas.height);
        
        ctx.imageSmoothingEnabled = false;
        ctx.filter = 'blur(15px)'; // Combine mosaic with blur
        ctx.drawImage(smallCanvas, 0, 0, smallCanvas.width, smallCanvas.height, x, y, w, h);
      }
      
      ctx.restore();
    }
  }
  
  return { canvas, facesCount: faces.length };
}

export async function processFile(file: File): Promise<{ file: File; facesCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const { canvas, facesCount } = await blurFaces(img);
          canvas.toBlob((blob) => {
            if (blob) {
              const blurredFile = new File([blob], file.name, { type: file.type });
              resolve({ file: blurredFile, facesCount });
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
