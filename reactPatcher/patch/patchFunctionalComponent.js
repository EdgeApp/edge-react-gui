// @flow
import { type ReactStore } from '../types.js'

export default (FunctionalComponent: any, displayName: string, reactStore: ReactStore) => {
  const PatchedFunctionalComponent = reactStore.settings.functionalHOC(FunctionalComponent)
  PatchedFunctionalComponent.displayName = displayName
  return PatchedFunctionalComponent
}
