import {
  AppParamList,
  BuyTabParamList,
  BuyTabSceneProps,
  DrawerParamList,
  DrawerSceneProps,
  EdgeAppSceneProps,
  EdgeAppStackParamList,
  EdgeSceneProps,
  NavigationProp,
  RootParamList,
  RootSceneProps,
  SellTabParamList,
  SellTabSceneProps,
  SwapTabParamList,
  SwapTabSceneProps,
  WalletsTabParamList,
  WalletsTabSceneProps
} from '../../types/routerTypes'

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

export const fakeCompositeNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  pop: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  addListener: jest.fn()
  // Include other methods as needed
} as any // HACK: Type assertion due to incomplete implementation

export function fakeRootSceneProps<Name extends keyof RootParamList>(name: Name, params: RootParamList[Name]): RootSceneProps<Name> {
  return fakeSceneProps(name, params as any) as any
}

export function fakeDrawerSceneProps<Name extends keyof DrawerParamList>(name: Name, params: DrawerParamList[Name]): DrawerSceneProps<Name> {
  return fakeSceneProps(name, params as any) as any
}

export function fakeEdgeAppSceneProps<Name extends keyof EdgeAppStackParamList>(name: Name, params: EdgeAppStackParamList[Name]): EdgeAppSceneProps<Name> {
  return fakeSceneProps(name, params as any) as any
}

export function fakeBuyTabSceneProps<Name extends keyof BuyTabParamList>(name: Name, params: BuyTabParamList[Name]): BuyTabSceneProps<Name> {
  return fakeSceneProps(name, params as any) as any
}

export function fakeSellTabSceneProps<Name extends keyof SellTabParamList>(name: Name, params: SellTabParamList[Name]): SellTabSceneProps<Name> {
  return fakeSceneProps(name, params as any) as any
}

export function fakeSwapTabSceneProps<Name extends keyof SwapTabParamList>(name: Name, params: SwapTabParamList[Name]): SwapTabSceneProps<Name> {
  return fakeSceneProps(name, params as any) as any
}

export function fakeWalletsTabSceneProps<Name extends keyof WalletsTabParamList>(name: Name, params: WalletsTabParamList[Name]): WalletsTabSceneProps<Name> {
  return fakeSceneProps(name, params as any) as any
}
