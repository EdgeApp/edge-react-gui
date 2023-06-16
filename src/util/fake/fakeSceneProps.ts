import { NavigationProp } from '../../types/routerTypes'

export const fakeNavigation: NavigationProp<any> = {
  addListener() {
    return () => undefined
  },
  removeListener() {},
  isFocused() {
    return true
  },

  navigate() {},
  push() {},
  replace() {},
  setParams(params) {},

  goBack() {},
  pop() {},
  popToTop() {},

  dispatch() {},
  reset() {},
  canGoBack() {
    return true
  },
  getId() {
    return undefined
  },
  getState() {
    return {
      key: 'foo',
      index: 0,
      routes: [],
      routeNames: [],
      type: 'bar',
      stale: false
    }
  },
  getParent() {
    throw new Error('not implemented')
  },
  setOptions() {}
}
