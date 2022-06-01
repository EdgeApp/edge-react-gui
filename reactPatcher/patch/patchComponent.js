// @flow
import { type ReactStore } from '../types.js'
import patchClassComponent from './patchClassComponent.js'
import patchForwardRefComponent from './patchForwardRefComponent.js'
import patchFunctionalComponent from './patchFunctionalComponent.js'
import patchMemoComponent from './patchMemoComponent.js'
import { getDisplayName, isForwardRefComponent, isFunctionalComponent, isMemoComponent, isReactClassComponent } from './utils'

const createPatchedComponent = (Component, displayName: string, reactStore: ReactStore) => {
  if (isMemoComponent(Component)) return patchMemoComponent(Component, displayName, reactStore)
  if (isForwardRefComponent(Component)) return patchForwardRefComponent(Component, displayName, reactStore)
  if (isReactClassComponent(Component)) return patchClassComponent(Component, displayName, reactStore)
  if (isFunctionalComponent(Component)) return patchFunctionalComponent(Component, displayName, reactStore)
  return Component
}

const getIsSupportedComponentType = Comp => {
  if (!Comp) return false
  if (isMemoComponent(Comp)) return getIsSupportedComponentType(Comp.type)
  if (isForwardRefComponent(Comp)) return getIsSupportedComponentType(Comp.render)
  if (typeof Comp === 'function') return true
}

export const patchComponent = (Component: any, reactStore: any) => {
  if (!getIsSupportedComponentType(Component)) return null

  const { exclude = [], filters = [], include = [] } = reactStore.settings

  const displayName = getDisplayName(Component)

  if (include.length > 0 && !include.includes(displayName)) return null
  if (exclude.includes(displayName)) return null
  if (filters.find(filter => filter.test(displayName)) != null) return null
  if (reactStore.componentsMap.has(Component)) return reactStore.componentsMap.get(Component)

  const PatchedComponent = createPatchedComponent(Component, displayName, reactStore)
  reactStore.componentsMap.set(Component, PatchedComponent)

  console.log('Patching Component:', displayName)
  console.log('The original Non Patched Component:', Component)
  console.log('The Patched Component:', PatchedComponent)

  return PatchedComponent
}
