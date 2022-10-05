// For debugging purposes only:

/**
 * A log utilities which only runs has an effect during debugging/development.
 * It runs any functions passed as arguments and logs the JSON serialized output.
 *
 * @param  {...any} fns Functions for which to run and log output
 * @returns void
 */
export const trace = (...fns: Array<() => any>): void => {
  if (process.env.NODE_ENV === 'production') return
  const outs = fns.map(fn => JSON.stringify(fn(), null, 2))
  console.log('\n[TRACE]\n', ...outs)
}
