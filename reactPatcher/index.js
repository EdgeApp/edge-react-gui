// @flow

import * as ReactNative from 'react-native'

import { patchComponent } from './patch/patchComponent'
import { type Settings, asReactStore } from './types.js'

export const Cavify = (React: any, settings: Settings) => {
  if (React.isCavify) return

  settings.exclude = Object.keys(ReactNative)
    .filter(key => !settings.include.includes(key))
    .concat(settings.exclude ?? [])

  const reactStore = asReactStore({
    React,
    origCreateElement: React.createElement,
    origCreateFactory: React.createFactory,
    origCloneElement: React.cloneElement,
    settings
  })

  React.createElement = function (origComponent, ...rest) {
    const patchedComponent = patchComponent(origComponent, reactStore)
    if (patchedComponent != null) {
      try {
        // $FlowFixMe
        return reactStore.origCreateElement?.apply(React, [patchedComponent, ...rest])
      } catch (e) {
        console.error('Cavify error', {
          errorInfo: {
            error: e,
            componentNameOrComponent: origComponent,
            rest
          }
        })
      }
    }

    // $FlowFixMe
    return reactStore.origCreateElement?.apply(React, [origComponent, ...rest])
  }
  Object.assign(React.createElement, reactStore.origCreateElement)

  React.createFactory = type => {
    const factory = React.createElement.bind(null, type)
    factory.type = type
    return factory
  }
  Object.assign(React.createFactory, reactStore.origCreateFactory)

  // $FlowFixMe
  React.cloneElement = (...args) => reactStore.origCloneElement?.apply(React, args)

  Object.assign(React.cloneElement, reactStore.origCloneElement)

  React.isCavify = true

  React.__REVERT_CAVIFY_REACT_COMPONENTS__ = () => {
    Object.assign(React, {
      createElement: reactStore.origCreateElement,
      createFactory: reactStore.origCreateFactory,
      cloneElement: reactStore.origCloneElement
    })

    reactStore.componentsMap = new WeakMap()

    delete React.__REVERT_CAVIFY_REACT_COMPONENTS__
    delete React.isCavify
  }

  return React
}
