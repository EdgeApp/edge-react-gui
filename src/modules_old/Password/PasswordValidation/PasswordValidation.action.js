export const UPPER_CASE_PASS = 'UPPER_CASE_TRUE'
export const UPPER_CASE_FAIL = 'UPPER_CASE_FALSE'
export const LOWER_CASE_PASS = 'LOWER_CASE_TRUE'
export const LOWER_CASE_FAIL = 'LOWER_CASE_FALSE'
export const NUMBER_PASS = 'NUMBER_TRUE'
export const NUMBER_FAIL = 'NUMBER_FALSE'
export const CHARACTER_LENGTH_PASS = 'CHARACTER_LENGTH_PASS'
export const CHARACTER_LENGTH_FAIL = 'CHARACTER_LENGTH_FAIL'
export const VALIDATE_PASSWORD = 'VALIDATE_PASSWORD'
export const INVALIDATE_PASSWORD = 'INVALIDATE_PASSWORD'

export function validatePassword () {
  return {
    type: VALIDATE_PASSWORD
  }
}
export function invalidatePassword () {
  return {
    type: INVALIDATE_PASSWORD
  }
}
export function upperCaseCharPass () {
  return {
    type: UPPER_CASE_PASS
  }
}

export function upperCaseCharFail () {
  return {
    type: UPPER_CASE_FAIL
  }
}

export function lowerCaseCharPass () {
  return {
    type: LOWER_CASE_PASS
  }
}

export function lowerCaseCharFail () {
  return {
    type: LOWER_CASE_FAIL
  }
}

export function numberPass () {
  return {
    type: NUMBER_PASS
  }
}

export function numberFail () {
  return {
    type: NUMBER_FAIL
  }
}

export function characterLengthPass () {
  return {
    type: CHARACTER_LENGTH_PASS
  }
}

export function characterLengthFail () {
  return {
    type: CHARACTER_LENGTH_FAIL
  }
}
