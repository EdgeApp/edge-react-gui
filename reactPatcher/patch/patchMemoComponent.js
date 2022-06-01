// @flow

import { type ReactStore } from '../types.js'
import patchClassComponent from './patchClassComponent.js'
import patchFunctionalComponent from './patchFunctionalComponent.js'
import patchMemoComponent from './patchMemoComponent.js'
import { defaults, isForwardRefComponent, isMemoComponent, isReactClassComponent } from './utils.js'

export default (MemoComponent: any, displayName: string, reactStore: ReactStore) => {
  const { type: InnerMemoComponent } = MemoComponent

  const isInnerMemoComponentAClassComponent = isReactClassComponent(InnerMemoComponent)
  const isInnerMemoComponentForwardRefs = isForwardRefComponent(InnerMemoComponent)
  const isInnerMemoComponentAnotherMemoComponent = isMemoComponent(InnerMemoComponent)

  const WrappedFunctionalComponent = isInnerMemoComponentForwardRefs ? InnerMemoComponent.render : InnerMemoComponent

  const PatchedInnerComponent = isInnerMemoComponentAClassComponent
    ? patchClassComponent(WrappedFunctionalComponent, displayName, reactStore)
    : isInnerMemoComponentAnotherMemoComponent
    ? patchMemoComponent(WrappedFunctionalComponent, displayName, reactStore)
    : patchFunctionalComponent(WrappedFunctionalComponent, displayName, reactStore)

  defaults(PatchedInnerComponent, WrappedFunctionalComponent)

  const { React = {} } = reactStore

  const MemoizedFunctionalComponent = React.memo(
    isInnerMemoComponentForwardRefs ? React.forwardRef(PatchedInnerComponent) : PatchedInnerComponent,
    MemoComponent.compare
  )

  defaults(MemoizedFunctionalComponent, MemoComponent)

  return MemoizedFunctionalComponent
}
