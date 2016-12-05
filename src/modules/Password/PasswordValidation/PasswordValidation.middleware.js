import * as action from './PasswordValidation.action'

export const validate = (password) => {
  return dispatch => {
    if (password.match(/[A-Z]/)) {
      dispatch(action.upperCaseCharPass())
    } else {
      dispatch(action.upperCaseCharFail())
    }

    if (password.match(/[a-z]/)) {
      dispatch(action.lowerCaseCharPass())
    } else {
      dispatch(action.lowerCaseCharFail())
    }

    if (password.match(/\d/)) {
      dispatch(action.numberPass())
    } else {
      dispatch(action.numberFail())
    }

    if (password.length >= 10) {
      dispatch(action.characterLengthPass())
    } else {
      dispatch(action.characterLengthFail())
    }
  }
}
