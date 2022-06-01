// @flow

import { type ReactStore } from '../types.js'
import patchFunctionalComponent from './patchFunctionalComponent.js'
import { defaults, isMemoComponent } from './utils.js'

export default (ForwardRefComponent: any, displayName: string, reactStore: ReactStore) => {
  const { render: InnerForwardRefComponent } = ForwardRefComponent

  const isInnerComponentMemoized = isMemoComponent(InnerForwardRefComponent)
  const WrappedFunctionalComponent = isInnerComponentMemoized ? InnerForwardRefComponent.type : InnerForwardRefComponent

  const WrappedByReactForwardRefFunctionalComponent = patchFunctionalComponent(WrappedFunctionalComponent, displayName, reactStore)

  defaults(WrappedByReactForwardRefFunctionalComponent, WrappedFunctionalComponent)

  const { React = {} } = reactStore

  const ForwardRefFunctionalComponent = React.forwardRef(
    isInnerComponentMemoized
      ? React.memo(WrappedByReactForwardRefFunctionalComponent, InnerForwardRefComponent.compare)
      : WrappedByReactForwardRefFunctionalComponent
  )

  defaults(ForwardRefFunctionalComponent ?? {}, ForwardRefComponent)

  return ForwardRefFunctionalComponent
}
