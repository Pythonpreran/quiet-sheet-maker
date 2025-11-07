// IndexedDB utilities for storing proof documents locally

const DB_NAME = 'ionconnect-proofs';
const STORE_NAME = 'proofs';
const DB_VERSION = 1;

export interface ProofDocument {
  id: string;
  title: string;
  category: string;
  imageData: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  aiAnalysis?: string;
  rejectionReason?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

export async function saveProof(proof: ProofDocument): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(proof);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllProofs(): Promise<ProofDocument[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const proofs = request.result as ProofDocument[];
      // Sort by timestamp descending
      resolve(proofs.sort((a, b) => b.timestamp - a.timestamp));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getProofById(id: string): Promise<ProofDocument | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateProofStatus(
  id: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<void> {
  const proof = await getProofById(id);
  if (!proof) throw new Error('Proof not found');

  proof.status = status;
  if (rejectionReason) {
    proof.rejectionReason = rejectionReason;
  }

  await saveProof(proof);
}

export async function deleteProof(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}