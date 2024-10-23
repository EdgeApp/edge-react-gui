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
  const navigation: RootSceneProps<Name>['navigation'] = fakeCompositeNavigation

  const route: RootSceneProps<Name>['route'] = {
    key: `${String(name)}-0`,
    name: name as Extract<Name, string>,
    params
  }

  const sceneProps: RootSceneProps<Name> = {
    navigation,
    route
  }

  return sceneProps
}

export function fakeDrawerSceneProps<Name extends keyof DrawerParamList>(name: Name, params: DrawerParamList[Name]): DrawerSceneProps<Name> {
  const navigation: DrawerSceneProps<Name>['navigation'] = fakeCompositeNavigation

  const route: DrawerSceneProps<Name>['route'] = {
    key: `${String(name)}-0`,
    name: name as Extract<Name, string>,
    params
  }

  const sceneProps: DrawerSceneProps<Name> = {
    navigation,
    route
  }

  return sceneProps
}

export function fakeEdgeAppSceneProps<Name extends keyof EdgeAppStackParamList>(name: Name, params: EdgeAppStackParamList[Name]): EdgeAppSceneProps<Name> {
  const navigation: EdgeAppSceneProps<Name>['navigation'] = fakeCompositeNavigation

  const route: EdgeAppSceneProps<Name>['route'] = {
    key: `${String(name)}-0`,
    name: name as Extract<Name, string>,
    params
  }

  const sceneProps: EdgeAppSceneProps<Name> = {
    navigation,
    route
  }

  return sceneProps
}

export function fakBuyTabSceneProps<Name extends keyof BuyTabParamList>(name: Name, params: BuyTabParamList[Name]): BuyTabSceneProps<Name> {
  const navigation: BuyTabSceneProps<Name>['navigation'] = fakeCompositeNavigation

  const route: BuyTabSceneProps<Name>['route'] = {
    key: `${String(name)}-0`,
    name: name as Extract<Name, string>,
    params
  }

  const sceneProps: BuyTabSceneProps<Name> = {
    navigation,
    route
  }

  return sceneProps
}

export function fakSellTabSceneProps<Name extends keyof SellTabParamList>(name: Name, params: SellTabParamList[Name]): SellTabSceneProps<Name> {
  const navigation: SellTabSceneProps<Name>['navigation'] = fakeCompositeNavigation

  const route: SellTabSceneProps<Name>['route'] = {
    key: `${String(name)}-0`,
    name: name as Extract<Name, string>,
    params
  }

  const sceneProps: SellTabSceneProps<Name> = {
    navigation,
    route
  }

  return sceneProps
}

export function fakeSwapTabSceneProps<Name extends keyof SwapTabParamList>(name: Name, params: SwapTabParamList[Name]): SwapTabSceneProps<Name> {
  const navigation: SwapTabSceneProps<Name>['navigation'] = fakeCompositeNavigation

  const route: SwapTabSceneProps<Name>['route'] = {
    key: `${String(name)}-0`,
    name: name as Extract<Name, string>,
    params
  }

  const sceneProps: SwapTabSceneProps<Name> = {
    navigation,
    route
  }

  return sceneProps
}

export function fakeWalletsTabSceneProps<Name extends keyof WalletsTabParamList>(name: Name, params: WalletsTabParamList[Name]): WalletsTabSceneProps<Name> {
  const navigation: WalletsTabSceneProps<Name>['navigation'] = fakeCompositeNavigation

  const route: WalletsTabSceneProps<Name>['route'] = {
    key: `${String(name)}-0`,
    name: name as Extract<Name, string>,
    params
  }

  const sceneProps: WalletsTabSceneProps<Name> = {
    navigation,
    route
  }

  return sceneProps
}
