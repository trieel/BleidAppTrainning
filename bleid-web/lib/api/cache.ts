/**
 * In-memory client cache with Stale-While-Revalidate (SWR) and in-flight promise deduplication.
 * Ensures instant (0ms) UI transitions and avoids duplicate parallel requests across components.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlightPromises = new Map<string, Promise<unknown>>();

export interface CacheOptions {
  /** Time to live in milliseconds before considering the entry stale. Default: 60_000 (1 min) */
  ttlMs?: number;
  /** Whether to return stale data immediately while updating in the background. Default: true */
  staleWhileRevalidate?: boolean;
  /** Force bypass of cache */
  forceRefresh?: boolean;
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const {
    ttlMs = 60_000,
    staleWhileRevalidate = true,
    forceRefresh = false,
  } = options;

  const now = Date.now();
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;

  // Si está en caché y aún está vigente, retornar de inmediato
  if (!forceRefresh && cached) {
    const isFresh = now - cached.timestamp < cached.ttlMs;
    if (isFresh) {
      return cached.data;
    }

    // Si es stale pero tenemos staleWhileRevalidate, devolvemos data vieja y revalidamos en fondo
    if (staleWhileRevalidate) {
      if (!inFlightPromises.has(key)) {
        const backgroundPromise = fetcher()
          .then((freshData) => {
            memoryCache.set(key, { data: freshData, timestamp: Date.now(), ttlMs });
            return freshData;
          })
          .catch(() => cached.data)
          .finally(() => {
            inFlightPromises.delete(key);
          });
        inFlightPromises.set(key, backgroundPromise);
      }
      return cached.data;
    }
  }

  // Si ya hay una petición en curso para la misma clave, compartir la promesa (deduplicación)
  const existingInFlight = inFlightPromises.get(key) as Promise<T> | undefined;
  if (existingInFlight) {
    return existingInFlight;
  }

  // Ejecutar la petición
  const promise = (async () => {
    try {
      const data = await fetcher();
      memoryCache.set(key, { data, timestamp: Date.now(), ttlMs });
      return data;
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}

/**
 * Invalida una clave exacta o todas las claves que comiencen con el prefijo dado.
 */
export function invalidateCache(keyOrPrefix?: string) {
  if (!keyOrPrefix) {
    memoryCache.clear();
    return;
  }

  Array.from(memoryCache.keys()).forEach((key) => {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      memoryCache.delete(key);
    }
  });
}

/**
 * Actualiza directamente el valor de una clave en caché (para updates optimistas)
 */
export function setCachedData<T>(key: string, data: T, ttlMs = 60_000) {
  memoryCache.set(key, { data, timestamp: Date.now(), ttlMs });
}

/**
 * Obtiene el valor actual en memoria sincrónicamente si existe
 */
export function getCachedDataSync<T>(key: string): T | undefined {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  return entry?.data;
}
