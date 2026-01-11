const BINARY_CHECK_SIZE = 8192;

export function isBinaryBuffer(buffer: Buffer): boolean {
  const checkSize = Math.min(buffer.length, BINARY_CHECK_SIZE);
  for (let i = 0; i < checkSize; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}
