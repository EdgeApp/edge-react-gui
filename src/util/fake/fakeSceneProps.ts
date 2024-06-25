import { AppParamList, EdgeSceneProps, NavigationProp } from '../../types/routerTypes'

export const fakeNavigation: NavigationProp<any> = {
  // Events:
  addListener() {
    return () => undefined
  },
  removeListener() {},

  // Status:
  canGoBack() {
    return true
  },
  getId() {
    return undefined
  },
  getParent() {
    return fakeNavigation as any
  },
  isFocused() {
    return true
  },

  // Forward navigation:
  navigate() {},
  navigateDeprecated() {},
  push() {},
  replace() {},
  setParams() {},

  // Backwards navigation:
  goBack() {},
  pop() {},
  popTo() {},
  popToTop() {},

  // Internal router state:
  dispatch() {},
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
  setOptions() {},
  setStateForNextRouteNamesChange() {},
  reset() {},

  // Cache management:
  preload() {},
  remove() {},
  retain() {}
}

export function fakeSceneProps<Name extends keyof AppParamList>(name: Name, params: AppParamList[Name]): EdgeSceneProps<Name> {
  return {
    navigation: fakeNavigation,
    route: {
      name: name,
      key: name + '-0',
      params
    } as any
  }
}
