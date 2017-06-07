export const SET_HEADER_HEIGHT = 'SET_HEADER_HEIGHT'
export const SET_DEVICE_DIMENSIONS = 'SET_DEVICE_DIMENSIONS'

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