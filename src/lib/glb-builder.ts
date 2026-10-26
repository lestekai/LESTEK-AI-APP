import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { removeProductBackground, loadSafeImage } from './background-remover.ts';

export type Product3DFormFactor = 'cutout' | 'device' | 'box' | 'hardware' | 'standee';

export interface GenerateGlbOptions {
  frontImage: string | File | Blob;
  backImage?: string | File | Blob | null;
  sideImage?: string | File | Blob | null;
  formFactor?: Product3DFormFactor;
  productName?: string;
  removeBackground?: boolean;
  tolerance?: number;
  onProgress?: (step: string, percent: number) => void;
}

export interface GeneratedGlbResult {
  blob: Blob;
  sizeBytes: number;
  fileName: string;
  cutoutDataUrl?: string;
}

/**
 * Creates a canvas texture with SRGB color space and high-quality mipmap filtering.
 */
function createTextureFromCanvas(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a procedural metallic or carbon edge texture for product sides.
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
 * Removes the background so ONLY the product itself is rendered with physical depth and PBR lighting.
 */
export async function buildGlbFromProductImages(options: GenerateGlbOptions): Promise<GeneratedGlbResult> {
  const {
    frontImage,
    backImage,
    sideImage,
    formFactor = 'cutout',
    productName = 'produto',
    removeBackground = true,
    tolerance = 32,
    onProgress,
  } = options;

  onProgress?.('Carregando foto e analisando fundo...', 15);

  let frontCanvas: HTMLCanvasElement;
  let cutoutDataUrl: string = '';
  let aspectRatio = 1.0;

  if (removeBackground) {
    onProgress?.('Removendo fundo da imagem com precisão...', 25);
    const cutoutResult = await removeProductBackground(frontImage, {
      tolerance,
      cropToFit: true,
      maxDimension: 800,
    });
    frontCanvas = cutoutResult.canvas;
    cutoutDataUrl = cutoutResult.dataUrl;
    aspectRatio = cutoutResult.aspectRatio;
  } else {
    const rawImg = await loadSafeImage(frontImage);
    frontCanvas = document.createElement('canvas');
    frontCanvas.width = Math.min(rawImg.naturalWidth || 800, 800);
    frontCanvas.height = Math.min(rawImg.naturalHeight || 800, 800);
    const ctx = frontCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(rawImg, 0, 0, frontCanvas.width, frontCanvas.height);
    }
    cutoutDataUrl = frontCanvas.toDataURL('image/png');
    aspectRatio = (rawImg.naturalHeight || 800) / Math.max(1, rawImg.naturalWidth || 800);
  }

  let backCanvas: HTMLCanvasElement | null = null;
  if (backImage) {
    try {
      if (removeBackground) {
        const backCutout = await removeProductBackground(backImage, {
          tolerance,
          cropToFit: true,
          maxDimension: 800,
        });
        backCanvas = backCutout.canvas;
      } else {
        const rawBack = await loadSafeImage(backImage);
        backCanvas = document.createElement('canvas');
        backCanvas.width = 800;
        backCanvas.height = Math.round(800 * aspectRatio);
        const bCtx = backCanvas.getContext('2d');
        if (bCtx) bCtx.drawImage(rawBack, 0, 0, backCanvas.width, backCanvas.height);
      }
    } catch (e) {
      console.warn('Back image load warning:', e);
    }
  }

  onProgress?.('Construindo geometria 3D PBR sem fundo...', 50);

  // Normalize 3D dimensions so longest side is ~1.8 units
  let targetWidth = 1.4;
  let targetHeight = targetWidth * aspectRatio;
  if (targetHeight > 2.0) {
    targetHeight = 2.0;
    targetWidth = targetHeight / Math.max(0.1, aspectRatio);
  }

  let targetDepth = 0.08; // Sleek physical product depth for cutout
  let metalness = 0.35;
  let roughness = 0.25;

  if (formFactor === 'box') {
    targetDepth = 0.38;
    metalness = 0.15;
    roughness = 0.5;
  } else if (formFactor === 'device') {
    targetDepth = 0.12;
    metalness = 0.75;
    roughness = 0.2;
  } else if (formFactor === 'hardware') {
    targetDepth = 0.16;
    metalness = 0.85;
    roughness = 0.25;
  } else if (formFactor === 'standee') {
    targetDepth = 0.06;
    metalness = 0.5;
    roughness = 0.15;
  }

  // Create Scene for Export
  const exportScene = new THREE.Scene();
  const modelGroup = new THREE.Group();
  modelGroup.name = `${productName}_3D_Model`;

  // Textures
  const frontTexture = createTextureFromCanvas(frontCanvas);
  const backTexture = backCanvas ? createTextureFromCanvas(backCanvas) : frontTexture;
  const edgeTexture = sideImage ? createTextureFromCanvas(frontCanvas) : createEdgeTexture();

  if (formFactor === 'cutout' || formFactor === 'standee') {
    // -------------------------------------------------------------
    // CUTOUT 3D MODEL: Only the product exists, with ZERO background!
    // -------------------------------------------------------------
    const planeGeo = new THREE.PlaneGeometry(targetWidth, targetHeight);

    // Front Face (Product cutout texture, alpha clipped)
    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTexture,
      transparent: true,
      alphaTest: 0.05, // Discards transparent background pixels
      roughness: 0.25,
      metalness: 0.3,
      side: THREE.FrontSide,
      depthWrite: true,
    });
    const frontMesh = new THREE.Mesh(planeGeo, frontMat);
    frontMesh.position.set(0, 0, targetDepth * 0.5);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;
    modelGroup.add(frontMesh);

    // Back Face (Mirrored cutout texture, slightly recessed)
    const backMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.3,
      metalness: 0.3,
      side: THREE.FrontSide,
      depthWrite: true,
    });
    const backMesh = new THREE.Mesh(planeGeo, backMat);
    backMesh.rotation.y = Math.PI; // Look towards -Z
    backMesh.position.set(0, 0, -targetDepth * 0.5);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    modelGroup.add(backMesh);

    // Volumetric Core (Internal depth layer to give true physical thickness)
    const depthSteps = 4;
    for (let i = 1; i < depthSteps; i++) {
      const zOffset = -targetDepth * 0.5 + (targetDepth * i) / depthSteps;
      const coreMat = new THREE.MeshStandardMaterial({
        map: frontTexture,
        transparent: true,
        alphaTest: 0.05,
        roughness: 0.4,
        metalness: 0.5,
        color: 0x666666,
        depthWrite: true,
      });
      const coreMesh = new THREE.Mesh(planeGeo, coreMat);
      coreMesh.position.set(0, 0, zOffset);
      coreMesh.scale.set(0.995, 0.995, 1);
      modelGroup.add(coreMesh);
    }

    // Grounding Stand / Pedestal Base (Subtle tech anchor)
    const baseGeo = new THREE.CylinderGeometry(targetWidth * 0.35, targetWidth * 0.4, 0.03, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      metalness: 0.85,
      roughness: 0.2,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -targetHeight * 0.5 - 0.015, 0);
    modelGroup.add(baseMesh);

  } else {
    // -------------------------------------------------------------
    // BOX / DEVICE / HARDWARE FORM FACTORS
    // -------------------------------------------------------------
    const edgeMaterial = new THREE.MeshStandardMaterial({
      map: edgeTexture,
      roughness,
      metalness,
      color: 0x222226,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      transparent: true,
      alphaTest: removeBackground ? 0.05 : 0.0,
      roughness: formFactor === 'box' ? 0.4 : 0.18,
      metalness: formFactor === 'box' ? 0.1 : 0.45,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      transparent: true,
      alphaTest: removeBackground ? 0.05 : 0.0,
      roughness,
      metalness,
      color: backCanvas ? 0xffffff : 0x1a1a1f,
    });

    const materials = [
      edgeMaterial, // +X right
      edgeMaterial, // -X left
      edgeMaterial, // +Y top
      edgeMaterial, // -Y bottom
      frontMaterial, // +Z front
      backMaterial, // -Z back
    ];

    const geometry = new THREE.BoxGeometry(targetWidth, targetHeight, targetDepth);
    const mainMesh = new THREE.Mesh(geometry, materials);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    modelGroup.add(mainMesh);

    // Subtle tech frame accent for hardware/device
    if (formFactor === 'hardware' || formFactor === 'device') {
      const frameGeo = new THREE.BoxGeometry(targetWidth + 0.03, targetHeight + 0.03, targetDepth * 0.85);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x09090c,
        metalness: 0.9,
        roughness: 0.15,
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.scale.set(1.005, 1.005, 0.98);
      modelGroup.add(frameMesh);
    }
  }

  // Center model group vertically
  modelGroup.position.set(0, targetHeight * 0.5, 0);
  exportScene.add(modelGroup);

  onProgress?.('Exportando arquivo binário .GLB otimizado...', 80);

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
            const output = JSON.stringify(gltf, null, 2);
            blob = new Blob([output], { type: 'model/gltf+json' });
          }

          const safeSlug = productName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 30);
          const fileName = `${safeSlug || 'produto'}-3d.glb`;

          onProgress?.('Modelo 3D concluído com sucesso!', 100);
          resolve({
            blob,
            sizeBytes: blob.size,
            fileName,
            cutoutDataUrl,
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
        embedImages: true,
      }
    );
  });
}
