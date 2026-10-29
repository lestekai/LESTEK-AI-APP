import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type StudioTheme = 'dark' | 'light' | 'neon';

export interface Viewer3DOptions {
  container: HTMLElement;
  modelUrl: string;
  autoRotate?: boolean;
  backgroundColor?: string | number | null;
  theme?: StudioTheme;
  onProgress?: (percent: number) => void;
  onLoaded?: () => void;
  onError?: (error: Error) => void;
}

export interface Viewer3DInstance {
  destroy: () => void;
  resetCamera: () => void;
  toggleAutoRotate: () => boolean;
  setAutoRotate: (enabled: boolean) => void;
  isAutoRotating: () => boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleWireframe: () => boolean;
  toggleFullscreen: () => void;
  setStudioTheme: (theme: StudioTheme) => StudioTheme;
  toggleStudioTheme: () => StudioTheme;
  getStudioTheme: () => StudioTheme;
}

/**
 * Creates an interactive Simplio3D-style WebGL viewer for GLB models.
 * Features:
 * - Photography studio environment with circular turntable stage
 * - PBR lighting rig (Key, Fill, Rim) with RoomEnvironment reflections
 * - Smooth OrbitControls with damping and turntable rotation
 * - Interactive themes: Dark Luxury Studio, Clean White Gallery, Cyber Tech
 * - Dynamic ground contact shadow
 */
export function create3DViewer(options: Viewer3DOptions): Viewer3DInstance {
  const {
    container,
    modelUrl,
    autoRotate: initialAutoRotate = true,
    backgroundColor = null,
    theme: initialTheme = 'dark',
    onProgress,
    onLoaded,
    onError,
  } = options;

  let destroyed = false;
  let animFrameId = 0;
  let isAutoRotate = initialAutoRotate;
  let isWireframe = false;
  let currentTheme: StudioTheme = initialTheme;
  let currentModelGroup: THREE.Group | null = null;

  // Detect Software WebGL
  const isSoftwareGl = (() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return false;
    }
  })();

  const width = Math.max(container.clientWidth || 300, 100);
  const height = Math.max(container.clientHeight || 300, 100);

  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1.1, 3.4);

  // Renderer (alpha: true enables the sleek studio gradient background)
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.outline = 'none';
  container.appendChild(renderer.domElement);

  // Studio Environment Reflection (RoomEnvironment)
  try {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();
  } catch (e) {
    console.warn('RoomEnvironment initialization fallback:', e);
  }

  // Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 1.4);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 6, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 15;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
  fillLight.position.set(-5, 3, -3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.6);
  rimLight.position.set(0, -3, -6);
  scene.add(rimLight);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = isAutoRotate;
  controls.autoRotateSpeed = 1.6;
  controls.maxPolarAngle = Math.PI * 0.88;
  controls.minDistance = 0.8;
  controls.maxDistance = 10;

  // Ground Contact Shadow generator
  function createContactShadow(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.35)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.0;
    return shadowMesh;
  }

  const contactShadow = createContactShadow();
  scene.add(contactShadow);

  // Simplio3D Studio Turntable Stage (Circular Platform Disc)
  const stageGroup = new THREE.Group();
  const stageGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.04, 64);
  const stageMat = new THREE.MeshStandardMaterial({
    color: 0x14141b,
    metalness: 0.85,
    roughness: 0.22,
  });
  const stageMesh = new THREE.Mesh(stageGeo, stageMat);
  stageMesh.position.y = -1.02;
  stageMesh.receiveShadow = true;
  stageGroup.add(stageMesh);

  // Subtle luminous rim accent ring around the turntable
  const ringGeo = new THREE.RingGeometry(1.38, 1.41, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = -0.999;
  stageGroup.add(ringMesh);

  scene.add(stageGroup);

  // Apply Theme Function
  function applyTheme(theme: StudioTheme) {
    currentTheme = theme;
    if (theme === 'light') {
      container.style.background = 'radial-gradient(circle at center, #ffffff 0%, #e2e8f0 70%, #cbd5e1 100%)';
      stageMat.color.setHex(0xe2e8f0);
      stageMat.metalness = 0.5;
      stageMat.roughness = 0.35;
      ringMat.color.setHex(0x94a3b8);
      ringMat.opacity = 0.3;
      hemiLight.color.setHex(0xffffff);
      hemiLight.groundColor.setHex(0xd1d5db);
      keyLight.color.setHex(0xffffff);
      fillLight.color.setHex(0xe2e8f0);
    } else if (theme === 'neon') {
      container.style.background = 'radial-gradient(circle at center, #0e172a 0%, #060b14 70%, #020408 100%)';
      stageMat.color.setHex(0x0f172a);
      stageMat.metalness = 0.9;
      stageMat.roughness = 0.15;
      ringMat.color.setHex(0x06b6d4);
      ringMat.opacity = 0.8;
      hemiLight.color.setHex(0x38bdf8);
      hemiLight.groundColor.setHex(0x020617);
      keyLight.color.setHex(0x67e8f9);
      fillLight.color.setHex(0x818cf8);
    } else {
      // Default: Dark Luxury Photography Studio
      container.style.background = 'radial-gradient(circle at center, #1b1b24 0%, #0c0c12 70%, #050508 100%)';
      stageMat.color.setHex(0x14141b);
      stageMat.metalness = 0.85;
      stageMat.roughness = 0.22;
      ringMat.color.setHex(0x3b82f6);
      ringMat.opacity = 0.45;
      hemiLight.color.setHex(0xf8fafc);
      hemiLight.groundColor.setHex(0x1e293b);
      keyLight.color.setHex(0xffffff);
      fillLight.color.setHex(0x93c5fd);
    }
  }

  // Apply initial theme
  applyTheme(initialTheme);

  let initialCamPos = new THREE.Vector3(0, 1.1, 3.4);
  let initialTarget = new THREE.Vector3(0, 0, 0);

  // GLTF Loader
  const loader = new GLTFLoader();
  loader.load(
    modelUrl,
    (gltf) => {
      if (destroyed) return;
      const model = gltf.scene;
      currentModelGroup = model;

      // Center and normalize model dimensions
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Offset model to center at (0, 0, 0)
      model.position.x = -center.x;
      model.position.y = -center.y;
      model.position.z = -center.z;

      // Normalize scale so biggest dimension is ~1.9 units
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1.9 / maxDim;
      const rootGroup = new THREE.Group();
      rootGroup.add(model);
      rootGroup.scale.set(scale, scale, scale);

      // Re-evaluate bounding box to align stage and contact shadow
      const reBox = new THREE.Box3().setFromObject(rootGroup);
      const stageY = reBox.min.y - 0.01;
      stageMesh.position.y = stageY - 0.02;
      ringMesh.position.y = stageY + 0.001;
      contactShadow.position.y = stageY + 0.003;

      const groundRadius = Math.max(size.x, size.z) * scale * 0.95;
      stageGroup.scale.set(Math.max(0.9, groundRadius), 1, Math.max(0.9, groundRadius));
      contactShadow.scale.set(Math.max(1.2, groundRadius * 1.5), Math.max(1.2, groundRadius * 1.5), 1);

      scene.add(rootGroup);

      // Configure materials for PBR studio rendering
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const matAny = m as any;
              if (matAny.map) {
                matAny.map.colorSpace = THREE.SRGBColorSpace;
                if (matAny.transparent || matAny.alphaTest > 0) {
                  matAny.alphaTest = Math.max(matAny.alphaTest || 0, 0.05);
                  matAny.depthWrite = true;
                }
              }
              if (m instanceof THREE.MeshStandardMaterial) {
                m.roughness = Math.min(Math.max(m.roughness, 0.15), 0.95);
                m.envMapIntensity = 1.0;
              }
            });
          }
        }
      });

      // Fit camera
      const cameraDistance = 3.2;
      camera.position.set(0, 0.7, cameraDistance);
      controls.target.set(0, 0, 0);
      controls.update();

      initialCamPos.copy(camera.position);
      initialTarget.copy(controls.target);

      if (onLoaded) onLoaded();
    },
    (xhr) => {
      if (xhr.total && xhr.total > 0) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        if (onProgress) onProgress(pct);
      }
    },
    (err) => {
      console.error('Error loading 3D GLB model:', err);
      if (onError) onError(err as Error);
    }
  );

  // Resize Observer
  const resizeObserver = new ResizeObserver(() => {
    if (destroyed) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  resizeObserver.observe(container);

  // Animation Loop
  function animate() {
    if (destroyed) return;
    animFrameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return {
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();

      // Dispose scene resources
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const matAny = m as any;
              if (matAny.map) matAny.map.dispose();
              m.dispose();
            });
          }
        }
      });

      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    },

    resetCamera: () => {
      camera.position.copy(initialCamPos);
      controls.target.copy(initialTarget);
      controls.update();
    },

    toggleAutoRotate: () => {
      isAutoRotate = !isAutoRotate;
      controls.autoRotate = isAutoRotate;
      return isAutoRotate;
    },

    setAutoRotate: (enabled: boolean) => {
      isAutoRotate = enabled;
      controls.autoRotate = enabled;
    },

    isAutoRotating: () => isAutoRotate,

    zoomIn: () => {
      controls.dollyIn(1.2);
      controls.update();
    },

    zoomOut: () => {
      controls.dollyOut(1.2);
      controls.update();
    },

    toggleWireframe: () => {
      isWireframe = !isWireframe;
      if (currentModelGroup) {
        currentModelGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                const matAny = m as any;
                if ('wireframe' in matAny) {
                  matAny.wireframe = isWireframe;
                }
              });
            }
          }
        });
      }
      return isWireframe;
    },

    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        container.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    },

    setStudioTheme: (theme: StudioTheme) => {
      applyTheme(theme);
      return currentTheme;
    },

    toggleStudioTheme: () => {
      const themes: StudioTheme[] = ['dark', 'light', 'neon'];
      const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
      applyTheme(themes[nextIdx]);
      return currentTheme;
    },

    getStudioTheme: () => currentTheme,
  };
}
