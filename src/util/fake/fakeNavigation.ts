import { NavigationProp } from '../../types/routerTypes'

export const fakeNavigation: NavigationProp<any> = {
  addListener() {
    return () => undefined
  },
  isFocused() {
    return true
  },

  navigate() {},
  push() {},
  replace() {},
  setParams() {},

  goBack() {},
  pop() {},
  popToTop() {},

  closeDrawer() {},
  openDrawer() {},
  toggleDrawer() {},

  state: {}
}
