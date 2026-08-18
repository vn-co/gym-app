export function parseStoredArray<T>(raw: string | null, key: string): T[] {
  if (raw === null) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new TypeError('Expected an array');
    }
    return parsed as T[];
  } catch (cause) {
    throw new Error(`Invalid stored data for ${key}`, { cause });
  }
}
