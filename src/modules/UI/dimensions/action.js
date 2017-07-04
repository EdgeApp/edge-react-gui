export const SET_HEADER_HEIGHT = 'SET_HEADER_HEIGHT'
export const SET_DEVICE_DIMENSIONS = 'SET_DEVICE_DIMENSIONS'
export const  SET_TAB_BAR_HEIGHT = 'SET_TAB_BAR_HEIGHT'

export function setHeaderHeight (height) {
  return {
    type: SET_HEADER_HEIGHT,
    data: height
  }
}


export function setDeviceDimensions(data) {
  return  {
    type: SET_DEVICE_DIMENSIONS,
    data
  }
}

export function setTabBarHeight (height) {
  return {
    type: SET_TAB_BAR_HEIGHT,
    data: height
  }
}