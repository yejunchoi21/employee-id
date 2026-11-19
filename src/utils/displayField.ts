/** Show a value when present; otherwise return null so UI can omit the row. */
export function optionalText(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
