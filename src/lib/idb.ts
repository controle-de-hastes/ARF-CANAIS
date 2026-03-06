const DB_NAME = 'arf_backup_db';
const STORE_NAME = 'handles';

export async function getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(handle, 'backup_dir_handle');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
        const db = await getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('backup_dir_handle');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('Error getting directory handle from IndexedDB:', err);
        return null;
    }
}

export async function verifyPermission(handle: FileSystemDirectoryHandle, withUserGesture = false): Promise<boolean> {
    const options = { mode: 'readwrite' };
    const hndl = handle as any;

    // Check if we already have permission
    if (await hndl.queryPermission(options) === 'granted') {
        return true;
    }

    // Request permission if not granted
    if (withUserGesture) {
        if (await hndl.requestPermission(options) === 'granted') {
            return true;
        }
    }

    return false;
}
