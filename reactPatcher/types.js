// @flow

import { asArray, asObject, asOptional, asString, asUnknown } from 'cleaners'

export const asSettings = asObject({
  exclude: asOptional(asArray(asString), []),
  filters: asOptional(asArray(asString), []),
  include: asOptional(asArray(asString), []),
  functionalHOC: (asUnknown: (a: any) => any),
  classHOC: (asUnknown: (a: any) => any)
})

export type Settings = $Call<typeof asSettings>

export const asReactStore = asObject({
  // The React object we patch
  React: asOptional(asObject),
  // The original React.createElement function
  origCreateElement: asOptional(asUnknown, undefined),
  // The original React.createFactory function
  origCreateFactory: asOptional(asUnknown, undefined),
  // The original React.cloneElement function
  origCloneElement: asOptional(asUnknown, undefined),
  // A weak map of all React elements to their Cavy patched react elements
  componentsMap: asOptional(asUnknown, new WeakMap<any, any>()),
  // Optional settings
  settings: asSettings
})

export type ReactStore = $Call<typeof asReactStore>
