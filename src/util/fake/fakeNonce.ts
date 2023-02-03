export function fakeNonce(start: number = 0): () => number {
  return () => ++start
}
