// @flow

export const updateCurrentSceneKey = (sceneKey: string) => ({
  type: 'UPDATE_CURRENT_SCENE_KEY',
  data: { sceneKey }
})
