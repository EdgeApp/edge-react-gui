import * as ACTION from './PasswordValidation.action'

export const upperCaseChar = (state = false, action) => {
  switch (action.type) {
    case ACTION.UPPER_CASE_PASS :
      return true

    case ACTION.UPPER_CASE_FAIL :
      return false

    default:
      return state
  }
}

export const passwordValid = (state = false, action) => {
  switch (action.type) {
    case ACTION.VALIDATE_PASSWORD :
      return true

    case ACTION.INVALIDATE_PASSWORD :
      return false

    default:
      return state
  }
}

export const lowerCaseChar = (state = false, action) => {
  switch (action.type) {
    case ACTION.LOWER_CASE_PASS :
      return true

    case ACTION.UPPER_CASE_FAIL :
      return false

    default:
      return state
  }
}

export const number = (state = false, action) => {
  switch (action.type) {
    case ACTION.NUMBER_PASS :
      return true

    case ACTION.NUMBER_FAIL :
      return false

    default:
      return state
  }
}

export const characterLength = (state = false, action) => {
  switch (action.type) {
    case ACTION.CHARACTER_LENGTH_PASS :
      return true

    case ACTION.CHARACTER_LENGTH_FAIL :
      return false

    default:
      return state
  }
}

