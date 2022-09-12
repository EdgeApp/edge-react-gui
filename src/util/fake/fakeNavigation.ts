import { NavigationProp } from '../../types/routerTypes'

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

  goBack() {},
  pop() {},
  popToTop() {},

  closeDrawer() {},
  openDrawer() {},
  toggleDrawer() {},

  state: {}
}
