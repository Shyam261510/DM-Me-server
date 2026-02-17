export function unwrapOrThrow<T extends { success: boolean; message?: string }>(
  result: T,
  context: string,
) {
  if (!result.success) {
    throw new Error(`${context}: ${result.message ?? "Unknown error"}`);
  }
  return result;
}
