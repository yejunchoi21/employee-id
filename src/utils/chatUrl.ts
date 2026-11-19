/** Returns a safe absolute HTTPS URL, or null if missing/invalid. */
export function getValidHttpsUrl(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}
