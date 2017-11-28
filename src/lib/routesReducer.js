import {ActionConst} from 'react-native-router-flux'

const initialState = {
  scene: {
    sceneName: '',
  }
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
  case ActionConst.FOCUS: {
    return {...state,
      scene: {
        sceneName: action.data
      }
    }
  }
  default:
    return state
  }
}
