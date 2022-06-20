// @flow

import { type NavigationProp } from '../../types/routerTypes.js'

export const fakeNavigation: NavigationProp<any> = {
  addListener(event, callback) {
    return () => undefined
  },
  isFocused() {
    return true
  },

  navigate(name, params) {},
  push(name, params) {},
  replace(name, params) {},
  setParams(params) {},
  jumpTo(name, params) {},

  goBack() {},
  pop() {},
  popToTop() {},

  closeDrawer() {},
  openDrawer() {},
  toggleDrawer() {},

  state: {},
  currentScene: {}
}
