import { AppParamList, EdgeSceneProps, NavigationProp } from '../../types/routerTypes'

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
