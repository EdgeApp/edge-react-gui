import * as action from './PasswordValidation.action'

export const validate = (password) => {
  return dispatch => {
    let valid = true
    if (password.match(/[A-Z]/)) {
      dispatch(action.upperCaseCharPass())
    } else {
      dispatch(action.upperCaseCharFail())
      valid = false
    }

    if (password.match(/[a-z]/)) {
      dispatch(action.lowerCaseCharPass())
    } else {
      dispatch(action.lowerCaseCharFail())
      valid = false
    }

    if (password.match(/\d/)) {
      dispatch(action.numberPass())
    } else {
      dispatch(action.numberFail())
      valid = false
    }

    if (password.length >= 10) {
      dispatch(action.characterLengthPass())
    } else {
      dispatch(action.characterLengthFail())
      valid = false
    }
    if (valid) {
      dispatch(action.validatePassword())
    } else {
      dispatch(action.invalidatePassword())
    }
  }
}
