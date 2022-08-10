// @flow

/**
 * This is used to check if flow has inferred a type to be empty.
 * This is known as an exhaustive check which is useful for handling cases
 * in a switch statement.
 *
 * The way to use it is to annotate with a $ExpectError directive and throw the
 * error it returns:
 *
 * // $ExpectError
 * throw exhaustiveCheck(effect.type)
 *
 * (ref: https://flow.org/en/docs/tips/switch-statement-exhaustiveness/)
 *
 * @param t The type which is asserted to be empty.
 */
export function exhaustiveCheck(t: empty): Error {
  return new Error(`IMPOSSIBLE ERROR`)
}
