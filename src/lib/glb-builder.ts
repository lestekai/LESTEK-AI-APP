import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

export type Product3DFormFactor = 'device' | 'box' | 'hardware' | 'standee';

export interface GenerateGlbOptions {
  frontImage: string | File;
  backImage?: string | File | null;
  sideImage?: string | File | null;
  formFactor?: Product3DFormFactor;
  productName?: string;
  onProgress?: (step: string, percent: number) => void;
}

export interface GeneratedGlbResult {
  blob: Blob;
  sizeBytes: number;
  fileName: string;
}

/**
 * Helper to convert File, Blob or URL string into an HTMLImageElement
 */
function loadImageElement(source: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl = '';
    if (typeof source !== 'string') {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else {
      img.src = source;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (e) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error(`Falha ao carregar textura de imagem: ${e}`));
    };
  });
}

/**
 * Creates a canvas texture from an HTMLImageElement with high-quality filtering and SRGB color space.
 */
function createCanvasTextureFromImage(img: HTMLImageElement): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  // Power of two or optimal resolution for GPU compatibility
  canvas.width = Math.min(img.naturalWidth || 1024, 2048);
  canvas.height = Math.min(img.naturalHeight || 1024, 2048);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a procedural metallic or matte edge texture for product sides
 */
function createEdgeTexture(baseColor = '#18181b', highlightColor = '#27272a'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle brushed metal streaks
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 4) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Subtle edge bevel highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, 512, 512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Synthesizes a real 3D model (.glb) purely in-browser using Three.js and GLTFExporter.
 * No external API keys or cloud rendering needed.
 */
export async function buildGlbFromProductImages(options: GenerateGlbOptions): Promise<GeneratedGlbResult> {
  const {
    frontImage,
    backImage,
    sideImage,
    formFactor = 'device',
    productName = 'produto',
    onProgress
  } = options;

  onProgress?.('Carregando foto de referência...', 20);
  const frontImg = await loadImageElement(frontImage);

  let backImg: HTMLImageElement | null = null;
  if (backImage) {
    try {
      backImg = await loadImageElement(backImage);
    } catch (e) {
      console.warn("Back image load error, falling back to styled backplate:", e);
    }
  }

  let sideImg: HTMLImageElement | null = null;
  if (sideImage) {
    try {
      sideImg = await loadImageElement(sideImage);
    } catch (e) {
      console.warn("Side image load error, falling back to procedural edge:", e);
    }
  }

  onProgress?.('Construindo malha 3D e materiais PBR...', 45);

  // Calculate real aspect ratio from the front photo
  const imgWidth = frontImg.naturalWidth || 800;
  const imgHeight = frontImg.naturalHeight || 800;
  const aspectRatio = imgHeight / imgWidth;

  // Base dimensions in 3D units (normalized around 1.5 units)
  const targetWidth = 1.4;
  const targetHeight = targetWidth * aspectRatio;

  let targetDepth = 0.12; // Default device thickness
  let metalness = 0.7;
  let roughness = 0.3;

  if (formFactor === 'box') {
    targetDepth = 0.38; // Volumetric packaging box
    metalness = 0.15;
    roughness = 0.55;
  } else if (formFactor === 'hardware') {
    targetDepth = 0.18; // GPU / Tech module
    metalness = 0.85;
    roughness = 0.25;
  } else if (formFactor === 'standee') {
    targetDepth = 0.08; // Sleek display slab
    metalness = 0.4;
    roughness = 0.2;
  }

  // Create Scene for Export
  const exportScene = new THREE.Scene();

  // Create Textures
  const frontTexture = createCanvasTextureFromImage(frontImg);
  const backTexture = backImg ? createCanvasTextureFromImage(backImg) : null;
  const edgeTexture = sideImg ? createCanvasTextureFromImage(sideImg) : createEdgeTexture();

  // Materials for BoxGeometry (right, left, top, bottom, front (+z), back (-z))
  // Three.js BoxGeometry face order:
  // 0: +X (Right side)
  // 1: -X (Left side)
  // 2: +Y (Top)
  // 3: -Y (Bottom)
  // 4: +Z (Front)
  // 5: -Z (Back)
  const edgeMaterial = new THREE.MeshStandardMaterial({
    map: edgeTexture,
    roughness: roughness,
    metalness: metalness,
    color: 0xcccccc
  });

  const frontMaterial = new THREE.MeshStandardMaterial({
    map: frontTexture,
    roughness: formFactor === 'box' ? 0.4 : 0.18,
    metalness: formFactor === 'box' ? 0.1 : 0.4,
  });

  const backMaterial = new THREE.MeshStandardMaterial({
    map: backTexture || (backImage ? frontTexture : edgeTexture),
    roughness: roughness,
    metalness: metalness,
    color: backTexture ? 0xffffff : 0x222226
  });

  const materials = [
    edgeMaterial, // +x right
    edgeMaterial, // -x left
    edgeMaterial, // +y top
    edgeMaterial, // -y bottom
    frontMaterial, // +z front
    backMaterial   // -z back
  ];

  const geometry = new THREE.BoxGeometry(targetWidth, targetHeight, targetDepth);
  const mainMesh = new THREE.Mesh(geometry, materials);
  mainMesh.name = `${productName}_Mesh`;
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;

  // Center alignment
  mainMesh.position.set(0, targetHeight * 0.5, 0);

  // Group
  const modelGroup = new THREE.Group();
  modelGroup.name = `${productName}_3D_Model`;
  modelGroup.add(mainMesh);

  // Optional subtle tech bezel / accent frame for hardware & standee
  if (formFactor === 'standee' || formFactor === 'hardware') {
    const frameGeo = new THREE.BoxGeometry(targetWidth + 0.04, targetHeight + 0.04, targetDepth * 0.9);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.9,
      roughness: 0.15
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.copy(mainMesh.position);
    frameMesh.scale.set(1.01, 1.01, 0.98);
    modelGroup.add(frameMesh);
  }

  exportScene.add(modelGroup);

  onProgress?.('Exportando arquivo binário .GLB...', 80);

  // Export to GLB
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      exportScene,
      (gltf) => {
        try {
          let blob: Blob;
          if (gltf instanceof ArrayBuffer) {
            blob = new Blob([gltf], { type: 'model/gltf-binary' });
          } else {
            // Stringified glTF fallback
            const output = JSON.stringify(gltf, null, 2);
            blob = new Blob([output], { type: 'model/gltf+json' });
          }

          const safeSlug = productName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 30);
          const fileName = `${safeSlug || 'produto'}-3d.glb`;

          onProgress?.('Concluído!', 100);
          resolve({
            blob,
            sizeBytes: blob.size,
            fileName
          });
        } catch (err) {
          reject(err);
        }
      },
      (error) => {
        reject(error);
      },
      {
        binary: true,
        onlyVisible: true,
        embedImages: true
      }
    );
  });
}
