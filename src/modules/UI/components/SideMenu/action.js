export const OPEN_SIDEBAR = 'OPEN_SIDEBAR'
export const CLOSE_SIDEBAR = 'CLOSE_SIDEBAR'

export function openSidebar () {
  return {
    type: OPEN_SIDEBAR
  }
}

export function closeSidebar () {
  return {
    type: CLOSE_SIDEBAR
  }
}
