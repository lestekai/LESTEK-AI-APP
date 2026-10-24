import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface Viewer3DOptions {
  container: HTMLElement;
  modelUrl: string;
  autoRotate?: boolean;
  backgroundColor?: string | number | null;
  onProgress?: (percent: number) => void;
  onLoaded?: () => void;
  onError?: (error: Error) => void;
}

export interface Viewer3DInstance {
  destroy: () => void;
  resetCamera: () => void;
  toggleAutoRotate: () => boolean;
  setAutoRotate: (enabled: boolean) => void;
  toggleWireframe: () => boolean;
  toggleFullscreen: () => void;
  isAutoRotating: () => boolean;
}

/**
 * Creates an interactive 3D WebGL viewer for GLB models with OrbitControls,
 * PBR lighting rig, procedural studio environment reflection, and contact shadow.
 */
export function create3DViewer(options: Viewer3DOptions): Viewer3DInstance {
  const {
    container,
    modelUrl,
    autoRotate: initialAutoRotate = true,
    backgroundColor = null,
    onProgress,
    onLoaded,
    onError,
  } = options;

  let destroyed = false;
  let animFrameId = 0;
  let isAutoRotate = initialAutoRotate;
  let isWireframe = false;
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
  if (backgroundColor) {
    scene.background = new THREE.Color(backgroundColor);
  }

  // Camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1.2, 3.5);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: backgroundColor === null,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
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

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
  fillLight.position.set(-5, 3, -3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.5);
  rimLight.position.set(0, -4, -6);
  scene.add(rimLight);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = isAutoRotate;
  controls.autoRotateSpeed = 1.8;
  controls.maxPolarAngle = Math.PI * 0.88;
  controls.minDistance = 0.8;
  controls.maxDistance = 12;

  // Ground Contact Shadow generator
  function createContactShadow(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
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
      opacity: 0.7,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.0;
    return shadowMesh;
  }

  const contactShadow = createContactShadow();
  scene.add(contactShadow);

  let initialCamPos = new THREE.Vector3(0, 1.2, 3.5);
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

      // Normalize scale so biggest dimension is ~2.0 units
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.0 / maxDim;
      const rootGroup = new THREE.Group();
      rootGroup.add(model);
      rootGroup.scale.set(scale, scale, scale);

      // Re-evaluate bounding box to align contact shadow
      const reBox = new THREE.Box3().setFromObject(rootGroup);
      contactShadow.position.y = reBox.min.y - 0.01;
      contactShadow.scale.set(maxDim * 0.8, maxDim * 0.8, 1);

      scene.add(rootGroup);

      // Configure materials
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const matAny = m as any;
              if (matAny.map) matAny.map.colorSpace = THREE.SRGBColorSpace;
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
      camera.position.set(0, 0.8, cameraDistance);
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

    isAutoRotating: () => isAutoRotate,
  };
}
