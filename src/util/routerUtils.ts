import { NavigationProp, NavigationState, ParamListBase, PartialState } from '@react-navigation/native'

export function getNavigationAbsolutePath(navigation: NavigationProp<ParamListBase>): string {
  const topNavigator = getTopMostNavigation(navigation)
  const navigationState = topNavigator.getState()
  return navigationStateToPath(navigationState)
}

export function getTopMostNavigation(navigation: NavigationProp<ParamListBase>): NavigationProp<ParamListBase> {
  const parent = navigation.getParent()
  if (parent == null) return navigation
  return getTopMostNavigation(parent)
}

export function navigationStateToPath(navigationState: NavigationState | PartialState<NavigationState>, basePath: string = ''): string {
  if (navigationState.routes == null || navigationState.index == null) return basePath
  const route = navigationState.routes[navigationState.index]
  if (route == null) return basePath
  if (route.state == null) return `${basePath}/${route.name}`
  return navigationStateToPath(route.state, `${basePath}/${route.name}`)
}
