// @flow

// copied from packages/shared/ReactSymbols.js in https://github.com/facebook/react
const hasSymbol = typeof Symbol === 'function' && Symbol.for
export const REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3
export const REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0

export const isReactClassComponent = (Component: any) => Component.prototype && !!Component.prototype.isReactComponent
export const isMemoComponent = (Component: any) => Component.$$typeof === REACT_MEMO_TYPE
export const isForwardRefComponent = (Component: any) => Component.$$typeof === REACT_FORWARD_REF_TYPE
export const isFunctionalComponent = (Component: any) => typeof Component === 'function'

export const getDisplayName = (type: any): string =>
  type.name || (type.type && getDisplayName(type.type)) || (type.render && getDisplayName(type.render)) || (typeof type === 'string' ? type : 'Unknown')

export const defaults = (target: Object, source: Object) => {
  source = Object(source)
  for (const key in source) {
    const value = target[key]
    // $FlowFixMe
    if ((value === undefined || value === Object.prototype[key]) && !Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = source[key]
    }
  }
  return target
}
