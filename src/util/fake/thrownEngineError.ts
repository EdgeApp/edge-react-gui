/**
 * What an engine refusal carried, for a test that expects one.
 *
 * Five CLI suites declared their own `ThrownEngineError` interface and four
 * their own `thrown()` beside it, in two spellings — sync and async — of one
 * idea. Here, beside the shared fakes, so a change to what a refusal carries
 * is one edit. Outside `src/__tests__`, because jest treats every file there
 * as a suite.
 */
export interface ThrownEngineError {
  code: string
  status: number
  message: string
  details?: Record<string, unknown>
}

function describe(error: unknown): ThrownEngineError {
  const engineError = error as Partial<ThrownEngineError> & Error
  return {
    code: engineError.code ?? '',
    status: engineError.status ?? 0,
    message: engineError.message,
    details: engineError.details
  }
}

/**
 * The code and status a synchronous call threw, or a failure if it threw
 * nothing. Only those two, because the suites that use it compare the whole
 * result and the classification is what they are about.
 */
export function thrownSync(fn: () => unknown): {
  code: string
  status: number
} {
  try {
    fn()
  } catch (error: unknown) {
    const { code, status } = describe(error)
    return { code, status }
  }
  throw new Error('expected a throw')
}

/** The refusal an async call rejected with, or a failure if it resolved. */
export async function thrown(
  fn: () => Promise<unknown>
): Promise<ThrownEngineError> {
  try {
    await fn()
  } catch (error: unknown) {
    return describe(error)
  }
  throw new Error('expected a throw')
}
