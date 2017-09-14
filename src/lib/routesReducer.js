import {ActionConst} from 'react-native-router-flux'

const initialState = {
  scene: {},
  stackDepth: 0
}

export default function reducer (state = initialState, action = {}) {
  switch (action.type) {
  case ActionConst.FOCUS: {
    let stackDepth
      = parseInt(action.scene.key.replace(action.scene.sceneKey, '').replace('_', ''))

    return {
      ...state,
      scene: action.scene,
      stackDepth: stackDepth
    }
  }
  default:
    return state
  }
}
