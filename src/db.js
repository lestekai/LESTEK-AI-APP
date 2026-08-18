import { db, storage, auth } from './firebase/firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const isConfigured = () => !!db;
export { auth };

// Local storage fallbacks when Firebase is not configured
const LOCAL_CONTENT_KEY = 'lestek_site_content';
const LOCAL_SERVICES_KEY = 'lestek_services';
const LOCAL_PRODUCTS_KEY = 'lestek_products';

function getLocalData(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Error saving to localStorage:", e);
  }
}

export async function fetchSiteContent() {
  if (!isConfigured()) {
    return getLocalData(LOCAL_CONTENT_KEY, {});
  }
  try {
    const querySnapshot = await getDocs(collection(db, 'site_content'));
    const content = {};
    querySnapshot.forEach(docSnap => {
      const item = docSnap.data();
      content[item.section] = { content: item.content, image_url: item.image_url };
    });
    return content;
  } catch (error) {
    console.warn("Error fetching site content (Check Firestore rules):", error.message || error);
    return getLocalData(LOCAL_CONTENT_KEY, {});
  }
}

export async function fetchServices() {
  if (!isConfigured()) {
    return getLocalData(LOCAL_SERVICES_KEY, []);
  }
  try {
    const q = query(collection(db, 'services'), orderBy('created_at', 'asc'));
    const querySnapshot = await getDocs(q);
    const data = [];
    querySnapshot.forEach(docSnap => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });
    return data;
  } catch (error) {
    console.warn("Error fetching services (Check Firestore rules):", error.message || error);
    return getLocalData(LOCAL_SERVICES_KEY, []);
  }
}

export async function fetchProducts() {
  if (!isConfigured()) {
    return getLocalData(LOCAL_PRODUCTS_KEY, []);
  }
  try {
    const q = query(collection(db, 'products'), orderBy('created_at', 'asc'));
    const querySnapshot = await getDocs(q);
    const data = [];
    querySnapshot.forEach(docSnap => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });
    return data;
  } catch (error) {
    console.warn("Error fetching products (Check Firestore rules):", error.message || error);
    return getLocalData(LOCAL_PRODUCTS_KEY, []);
  }
}

export async function updateSiteContent(section, content, image_url = undefined) {
  const localContent = getLocalData(LOCAL_CONTENT_KEY, {});
  const payload = { section, content };
  if (image_url !== undefined) {
    payload.image_url = image_url;
  } else if (localContent[section]?.image_url) {
    payload.image_url = localContent[section].image_url;
  }
  localContent[section] = payload;
  setLocalData(LOCAL_CONTENT_KEY, localContent);

  if (!isConfigured()) return;

  try {
    const docRef = doc(db, 'site_content', section);
    const firestorePayload = { section, content };
    if (image_url !== undefined) {
      firestorePayload.image_url = image_url;
    } else {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().image_url) {
        firestorePayload.image_url = docSnap.data().image_url;
      }
    }
    await setDoc(docRef, firestorePayload, { merge: true });
  } catch (error) {
    console.error(`Error updating ${section}:`, error);
    throw new Error("Erro de permissão no Firebase. As edições foram salvas apenas localmente. Acesse as regras do Firestore e ative a permissão de leitura/gravação: " + error.message);
  }
}

export async function saveService(service) {
  if (!service.created_at) {
    service.created_at = new Date().toISOString();
  }
  if (!service.id) {
    service.id = 'srv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }
  const services = getLocalData(LOCAL_SERVICES_KEY, []);
  const idx = services.findIndex(s => s.id === service.id);
  if (idx >= 0) services[idx] = service;
  else services.push(service);
  setLocalData(LOCAL_SERVICES_KEY, services);

  if (!isConfigured()) return;

  try {
    const docRef = doc(db, 'services', service.id);
    await setDoc(docRef, service, { merge: true });
  } catch (error) {
    console.error("Error saving service:", error);
    throw new Error("Erro de permissão no Firebase: " + error.message);
  }
}

export async function deleteService(id) {
  const services = getLocalData(LOCAL_SERVICES_KEY, []).filter(s => s.id !== id);
  setLocalData(LOCAL_SERVICES_KEY, services);

  if (!isConfigured()) return;

  try {
    await deleteDoc(doc(db, 'services', id));
  } catch (error) {
    console.error("Error deleting service:", error);
    throw new Error("Erro de permissão no Firebase: " + error.message);
  }
}

export async function saveProduct(product) {
  if (!product.created_at) {
    product.created_at = new Date().toISOString();
  }
  if (!product.id) {
    product.id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }
  const products = getLocalData(LOCAL_PRODUCTS_KEY, []);
  const idx = products.findIndex(p => p.id === product.id);
  if (idx >= 0) products[idx] = product;
  else products.push(product);
  setLocalData(LOCAL_PRODUCTS_KEY, products);

  if (!isConfigured()) return;

  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (error) {
    console.error("Error saving product:", error);
    throw new Error("Erro de permissão no Firebase: " + error.message);
  }
}

export async function deleteProduct(id) {
  const products = getLocalData(LOCAL_PRODUCTS_KEY, []).filter(p => p.id !== id);
  setLocalData(LOCAL_PRODUCTS_KEY, products);

  if (!isConfigured()) return;

  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Erro de permissão no Firebase: " + error.message);
  }
}

function fileToBase64(file, maxDimension = 600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const isPng = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/svg+xml';
            const mimeType = isPng ? 'image/png' : 'image/jpeg';
            resolve(canvas.toDataURL(mimeType, isPng ? undefined : quality));
          } catch (err) {
            resolve(event.target.result);
          }
        };
        img.onerror = () => resolve(event.target.result);
      };
      reader.onerror = (error) => reject(error);
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    }
  });
}

export async function uploadImage(file, bucket = 'assets') {
  if (isConfigured() && storage) {
    try {
      const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, '') : 'image';
      const fileName = `${Date.now()}-${safeName}`;
      const storageRef = ref(storage, `${bucket}/${fileName}`);
      
      // Use Promise.race to add a timeout for Firebase Storage upload
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Firebase Storage upload timeout")), 5000);
      });
      
      await Promise.race([uploadPromise, timeoutPromise]);
      const publicUrl = await getDownloadURL(storageRef);
      return publicUrl;
    } catch (error) {
      console.warn("Firebase Storage indisponível ou requer upgrade. Utilizando fallback otimizado para Base64/Firestore:", error.message || error);
    }
  }
  // Fallback to Base64 compression stored directly in Firestore or localStorage
  return await fileToBase64(file);
}


