const DB_NAME = 'northline-portraits'
const STORE_NAME = 'portraits'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open portrait storage.'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Portrait storage request failed.'))
  })
}

export async function savePortraitBlob(
  portraitId: string,
  blob: Blob,
): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    await requestToPromise(tx.objectStore(STORE_NAME).put(blob, portraitId))
  } finally {
    db.close()
  }
}

export async function getPortraitBlob(
  portraitId: string,
): Promise<Blob | null> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const result = await requestToPromise(
      tx.objectStore(STORE_NAME).get(portraitId),
    )
    return result instanceof Blob ? result : null
  } finally {
    db.close()
  }
}

export async function deletePortraitBlob(portraitId: string): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    await requestToPromise(tx.objectStore(STORE_NAME).delete(portraitId))
  } finally {
    db.close()
  }
}
