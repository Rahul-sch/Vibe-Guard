export function buildLineIndex(content: string): number[] {
  const starts = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

export function offsetToLineCol(
  offset: number,
  lineStarts: number[]
): { line: number; column: number } {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (lineStarts[mid] <= offset) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return {
    line: low + 1,
    column: offset - lineStarts[low] + 1,
  };
}

export function extractSnippet(
  content: string,
  line: number,
  lineStarts: number[],
  maxLength = 200
): string {
  const lineIndex = line - 1;
  if (lineIndex < 0 || lineIndex >= lineStarts.length) {
    return '';
  }

  const start = lineStarts[lineIndex];
  const end =
    lineIndex + 1 < lineStarts.length
      ? lineStarts[lineIndex + 1] - 1
      : content.length;

  const snippet = content.slice(start, end).trim();
  return snippet.length > maxLength
    ? snippet.slice(0, maxLength - 3) + '...'
    : snippet;
}
