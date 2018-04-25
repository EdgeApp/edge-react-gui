// @flow

export const UPDATE_CURRENT_SCENE_KEY = 'UPDATE_CURRENT_SCENE_KEY'

export function updateCurrentSceneKey (sceneKey: string) {
  return {
    type: UPDATE_CURRENT_SCENE_KEY,
    data: { sceneKey }
  }
}
